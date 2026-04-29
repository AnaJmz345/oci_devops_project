package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class TaskNaturalLanguageService {

    private final DeepSeekService deepSeekService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Path DEBUG_FILE = Paths.get("task-ia-debug.log");
    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2})\\b");
    private static final Pattern SLASH_DATE_PATTERN = Pattern.compile("\\b(\\d{1,2})/(\\d{1,2})/(\\d{4})\\b");
    private static final Pattern ENGLISH_DATE_PATTERN = Pattern.compile(
            "\\b(?:on\\s+|by\\s+|for\\s+|due\\s+)?([a-z]+)\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,)?\\s+(\\d{4})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern ENGLISH_DATE_PATTERN_DAY_FIRST = Pattern.compile(
            "\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?([a-z]+)\\s+(\\d{4})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SPRINT_PATTERN = Pattern.compile("\\bsprint\\s+(\\d+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    public TaskNaturalLanguageService(DeepSeekService deepSeekService) {
        this.deepSeekService = deepSeekService;
    }

    public TaskDraft extractTaskDraft(String userMessage) {
        debug("========== TASK EXTRACTION ==========");
        debug("Received message for task creation:");
        debug(userMessage);

        String prompt = "Extract data to create a task. "
                + "Reply ONLY with valid JSON, no markdown and no explanations. "
                + "Expected fields: taskName, description, dueDate, sprintId, assigneeEmail. "
                + "dueDate must be formatted as yyyy-MM-dd. "
                + "sprintId must be a number if the user says something like sprint 2. "
                + "assigneeEmail must be the assignee email if one appears. "
                + "Use null for missing fields. "
                + "Message: " + userMessage;

        try {
            debug("Prompt sent to extract task:");
            debug(prompt);

            String response = deepSeekService.generateText(prompt);
            debug("Raw API response for task:");
            debug(response);

            String assistantContent = extractAssistantContent(response);
            debug("Assistant content for task:");
            debug(assistantContent);

            String json = extractJson(assistantContent);
            debug("Extracted JSON for task:");
            debug(json);

            JsonNode root = objectMapper.readTree(json);

            TaskDraft draft = new TaskDraft();
            draft.setOriginalMessage(userMessage);
            draft.setTaskName(readText(root, "taskName"));
            draft.setDescription(readText(root, "description"));
            draft.setDueDate(readDate(root, "dueDate"));
            draft.setSprintId(readLong(root, "sprintId"));
            draft.setAssigneeEmail(readText(root, "assigneeEmail"));

            debug("Draft before fallback:");
            debug(draft.toDebugString());

            applyFallbacks(draft, userMessage);

            debug("Draft after fallback:");
            debug(draft.toDebugString());

            return draft;
        } catch (Exception exc) {
            debug("AI extraction failed. Local fallbacks will be used.");
            debug("Error: " + exc.getClass().getName() + " - " + exc.getMessage());

            TaskDraft draft = new TaskDraft();
            draft.setOriginalMessage(userMessage);
            applyFallbacks(draft, userMessage);

            debug("Draft built only with fallback:");
            debug(draft.toDebugString());

            return draft;
        }
    }

    public LocalDate extractDueDate(String userMessage) {
        debug("========== DATE EXTRACTION ==========");
        debug("Received message to extract date:");
        debug(userMessage);

        LocalDate localDate = parseDateLocally(userMessage);
        if (localDate != null) {
            debug("Date extracted locally: " + localDate);
            return localDate;
        }

        debug("Could not extract date locally. Trying AI.");
        return extractTaskDraft("due date: " + userMessage).getDueDate();
    }

    private String extractAssistantContent(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);

            JsonNode openAiContent = root.path("choices").path(0).path("message").path("content");
            if (!openAiContent.isMissingNode() && !openAiContent.isNull()) {
                return openAiContent.asText();
            }

            JsonNode geminiContent = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (!geminiContent.isMissingNode() && !geminiContent.isNull()) {
                return geminiContent.asText();
            }
        } catch (Exception exc) {
            debug("Could not parse response as JSON wrapper. Raw response will be used.");
            return response;
        }

        return response;
    }

    private String extractJson(String response) {
        int start = response.indexOf("{");
        int end = response.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }

        return response;
    }

    private String readText(JsonNode root, String field) {
        JsonNode node = root.get(field);
        if (node == null || node.isNull()) {
            return null;
        }

        String value = node.asText();
        return value == null || value.isBlank() ? null : value.trim();
    }

    private LocalDate readDate(JsonNode root, String field) {
        String value = readText(root, field);
        if (value == null) {
            return null;
        }

        return LocalDate.parse(value);
    }

    private Long readLong(JsonNode root, String field) {
        JsonNode node = root.get(field);
        if (node == null || node.isNull()) {
            return null;
        }

        return node.asLong();
    }

    private void applyFallbacks(TaskDraft draft, String userMessage) {
        if (draft.getTaskName() == null) {
            draft.setTaskName(extractBetween(userMessage,
                    "(?:called|named|titled)\\s+",
                    ",?\\s+(?:with|and)\\s+(?:the\\s+)?description|,?\\s+(?:due|with\\s+due\\s+date|deadline|by)|,?\\s+(?:for|in|belongs\\s+to)\\s+sprint|$"));
        }

        if (draft.getDescription() == null) {
            draft.setDescription(extractBetween(userMessage,
                    "(?:with|and)\\s+(?:the\\s+)?description\\s+(?:as\\s+|of\\s+|to\\s+)?",
                    ",?\\s+(?:due|with\\s+due\\s+date|deadline|by)|,?\\s+(?:for|in|belongs\\s+to)\\s+sprint|$"));
        }

        if (draft.getDueDate() == null) {
            draft.setDueDate(parseDateLocally(userMessage));
        }

        if (draft.getSprintId() == null) {
            Matcher matcher = SPRINT_PATTERN.matcher(userMessage);
            if (matcher.find()) {
                draft.setSprintId(Long.valueOf(matcher.group(1)));
            }
        }

        if (draft.getAssigneeEmail() == null) {
            Matcher matcher = EMAIL_PATTERN.matcher(userMessage);
            if (matcher.find()) {
                draft.setAssigneeEmail(matcher.group());
            }
        }
    }

    private String extractBetween(String text, String startRegex, String endRegex) {
        Pattern pattern = Pattern.compile(startRegex + "(.+?)(?=" + endRegex + ")", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) {
            return null;
        }

        String value = matcher.group(1).trim();
        return value.isBlank() ? null : value;
    }

    private LocalDate parseDateLocally(String text) {
        Matcher isoMatcher = ISO_DATE_PATTERN.matcher(text);
        if (isoMatcher.find()) {
            return LocalDate.parse(isoMatcher.group(1));
        }

        Matcher slashMatcher = SLASH_DATE_PATTERN.matcher(text);
        if (slashMatcher.find()) {
            int day = Integer.parseInt(slashMatcher.group(1));
            int month = Integer.parseInt(slashMatcher.group(2));
            int year = Integer.parseInt(slashMatcher.group(3));
            return LocalDate.of(year, month, day);
        }

        Matcher englishMatcher = ENGLISH_DATE_PATTERN.matcher(normalize(text));
        if (englishMatcher.find()) {
            int month = monthNumber(englishMatcher.group(1));
            int day = Integer.parseInt(englishMatcher.group(2));
            int year = Integer.parseInt(englishMatcher.group(3));
            if (month > 0) {
                return LocalDate.of(year, month, day);
            }
        }

        Matcher dayFirstMatcher = ENGLISH_DATE_PATTERN_DAY_FIRST.matcher(normalize(text));
        if (dayFirstMatcher.find()) {
            int day = Integer.parseInt(dayFirstMatcher.group(1));
            int month = monthNumber(dayFirstMatcher.group(2));
            int year = Integer.parseInt(dayFirstMatcher.group(3));
            if (month > 0) {
                return LocalDate.of(year, month, day);
            }
        }

        return null;
    }

    private int monthNumber(String month) {
        String normalizedMonth = normalize(month);
        if (normalizedMonth.endsWith("january")) return 1;
        if (normalizedMonth.endsWith("february")) return 2;
        if (normalizedMonth.endsWith("march")) return 3;
        if (normalizedMonth.endsWith("april")) return 4;
        if (normalizedMonth.endsWith("may")) return 5;
        if (normalizedMonth.endsWith("june")) return 6;
        if (normalizedMonth.endsWith("july")) return 7;
        if (normalizedMonth.endsWith("august")) return 8;
        if (normalizedMonth.endsWith("september")) return 9;
        if (normalizedMonth.endsWith("october")) return 10;
        if (normalizedMonth.endsWith("november")) return 11;
        if (normalizedMonth.endsWith("december")) return 12;
        return -1;
    }

    private String normalize(String text) {
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private void debug(String message) {
        try {
            Files.writeString(
                    DEBUG_FILE,
                    "[" + LocalDateTime.now() + "] " + message + System.lineSeparator(),
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND
            );
        } catch (Exception exc) {
            // Do not break the bot if debug logging fails.
        }
    }

    public static class TaskDraft {
        private String originalMessage;
        private String taskName;
        private String description;
        private LocalDate dueDate;
        private Long sprintId;
        private String assigneeEmail;
        private String pendingField;

        public String getOriginalMessage() { return originalMessage; }
        public void setOriginalMessage(String originalMessage) { this.originalMessage = originalMessage; }

        public String getTaskName() { return taskName; }
        public void setTaskName(String taskName) { this.taskName = taskName; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public LocalDate getDueDate() { return dueDate; }
        public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

        public Long getSprintId() { return sprintId; }
        public void setSprintId(Long sprintId) { this.sprintId = sprintId; }

        public String getAssigneeEmail() { return assigneeEmail; }
        public void setAssigneeEmail(String assigneeEmail) { this.assigneeEmail = assigneeEmail; }

        public String getPendingField() { return pendingField; }
        public void setPendingField(String pendingField) { this.pendingField = pendingField; }

        public boolean isComplete() {
            return pendingField == null && taskName != null && dueDate != null && assigneeEmail != null;
        }

        public String nextMissingQuestion() {
            if ("TASK_NAME".equals(pendingField)) {
                return "What should the task be called?";
            }
            if ("DUE_DATE".equals(pendingField)) {
                return "What is the due date? It must be today or later.";
            }
            if ("ASSIGNEE_EMAIL".equals(pendingField)) {
                return "Which developer email should I assign it to?";
            }
            if ("SPRINT".equals(pendingField)) {
                return "Which sprint does it belong to?";
            }
            if (taskName == null) {
                return "What should the task be called?";
            }
            if (dueDate == null) {
                return "What is the due date? It must be today or later.";
            }
            if (assigneeEmail == null) {
                return "Which developer email should I assign it to?";
            }
            return null;
        }

        public String toDebugString() {
            return "TaskDraft{"
                    + "taskName='" + taskName + '\''
                    + ", description='" + description + '\''
                    + ", dueDate=" + dueDate
                    + ", sprintId=" + sprintId
                    + ", assigneeEmail='" + assigneeEmail + '\''
                    + ", pendingField='" + pendingField + '\''
                    + '}';
        }
    }
}

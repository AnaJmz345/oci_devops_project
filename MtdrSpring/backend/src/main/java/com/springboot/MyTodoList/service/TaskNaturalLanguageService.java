package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class TaskNaturalLanguageService {

    private final DeepSeekService deepSeekService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2})\\b");
    private static final Pattern SLASH_DATE_PATTERN = Pattern.compile("\\b(\\d{1,2})/(\\d{1,2})/(\\d{4})\\b");
    private static final Pattern SPANISH_DATE_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s+(?:de\\s+)?([a-z]+)\\s+(?:de\\s+|del\\s+)?(\\d{4})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SPRINT_PATTERN = Pattern.compile("\\bsprint\\s+(\\d+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    public TaskNaturalLanguageService(DeepSeekService deepSeekService) {
        this.deepSeekService = deepSeekService;
    }

    public TaskDraft extractTaskDraft(String userMessage) {
        String prompt = "Extrae datos para crear una tarea. "
                + "Responde SOLO JSON valido, sin markdown ni explicaciones. "
                + "Campos esperados: taskName, description, dueDate, sprintId, assigneeEmail. "
                + "dueDate debe ir en formato yyyy-MM-dd. "
                + "sprintId debe ser numero si el usuario dice algo como sprint 2. "
                + "assigneeEmail debe ser el correo de la persona asignada si aparece. "
                + "Si falta un campo usa null. "
                + "Mensaje: " + userMessage;

        try {
            String response = deepSeekService.generateText(prompt);
            String assistantContent = extractAssistantContent(response);
            String json = extractJson(assistantContent);
            JsonNode root = objectMapper.readTree(json);

            TaskDraft draft = new TaskDraft();
            draft.setOriginalMessage(userMessage);
            draft.setTaskName(readText(root, "taskName"));
            draft.setDescription(readText(root, "description"));
            draft.setDueDate(readDate(root, "dueDate"));
            draft.setSprintId(readLong(root, "sprintId"));
            draft.setAssigneeEmail(readText(root, "assigneeEmail"));
            applyFallbacks(draft, userMessage);
            return draft;
        } catch (Exception exc) {
            TaskDraft draft = new TaskDraft();
            draft.setOriginalMessage(userMessage);
            applyFallbacks(draft, userMessage);
            return draft;
        }
    }

    public LocalDate extractDueDate(String userMessage) {
        LocalDate localDate = parseDateLocally(userMessage);
        if (localDate != null) {
            return localDate;
        }

        return extractTaskDraft("fecha de entrega: " + userMessage).getDueDate();
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
                    "se llame\\s+",
                    ",?\\s+con la descripci.n|,?\\s+con fecha|,?\\s+con la fecha|,?\\s+para el sprint|$"));
        }

        if (draft.getDescription() == null) {
            draft.setDescription(extractBetween(userMessage,
                    "con la descripci.n\\s+",
                    ",?\\s+con fecha|,?\\s+con la fecha|,?\\s+para el sprint|$"));
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

        Matcher spanishMatcher = SPANISH_DATE_PATTERN.matcher(normalize(text));
        if (spanishMatcher.find()) {
            int day = Integer.parseInt(spanishMatcher.group(1));
            int month = monthNumber(spanishMatcher.group(2));
            int year = Integer.parseInt(spanishMatcher.group(3));
            if (month > 0) {
                return LocalDate.of(year, month, day);
            }
        }

        return null;
    }

    private int monthNumber(String month) {
        String normalizedMonth = normalize(month);
        if (normalizedMonth.endsWith("enero")) return 1;
        if (normalizedMonth.endsWith("febrero")) return 2;
        if (normalizedMonth.endsWith("marzo")) return 3;
        if (normalizedMonth.endsWith("abril")) return 4;
        if (normalizedMonth.endsWith("mayo")) return 5;
        if (normalizedMonth.endsWith("junio")) return 6;
        if (normalizedMonth.endsWith("julio")) return 7;
        if (normalizedMonth.endsWith("agosto")) return 8;
        if (normalizedMonth.endsWith("septiembre")) return 9;
        if (normalizedMonth.endsWith("setiembre")) return 9;
        if (normalizedMonth.endsWith("octubre")) return 10;
        if (normalizedMonth.endsWith("noviembre")) return 11;
        if (normalizedMonth.endsWith("diciembre")) return 12;
        return -1;
    }

    private String normalize(String text) {
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    public static class TaskDraft {
        private String originalMessage;
        private String taskName;
        private String description;
        private LocalDate dueDate;
        private Long sprintId;
        private String assigneeEmail;

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

        public boolean isComplete() {
            return taskName != null && dueDate != null && assigneeEmail != null;
        }

        public String nextMissingQuestion() {
            if (taskName == null) {
                return "Como se llama la tarea?";
            }
            if (dueDate == null) {
                return "Cual es la fecha de entrega?";
            }
            if (assigneeEmail == null) {
                return "A que correo de developer se la asigno?";
            }
            return null;
        }
    }
}

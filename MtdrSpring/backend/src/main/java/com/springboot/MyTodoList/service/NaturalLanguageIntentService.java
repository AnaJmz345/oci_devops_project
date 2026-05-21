package com.springboot.MyTodoList.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NaturalLanguageIntentService {

    private static final Logger logger = LoggerFactory.getLogger(NaturalLanguageIntentService.class);
    private static final String LIST_TASKS = "LIST_TASKS";
    private static final String CREATE_TASK = "CREATE_TASK";
    private static final String UNKNOWN = "UNKNOWN";
    private static final Path DEBUG_FILE = Paths.get("task-ia-debug.log");

    private final DeepSeekService deepSeekService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NaturalLanguageIntentService(DeepSeekService deepSeekService) {
        this.deepSeekService = deepSeekService;
    }

    public String detectIntent(String userMessage) {
        debug("========== INTENT DETECTION ==========");
        debug("Received message: " + userMessage);

        if (userMessage == null || userMessage.trim().isEmpty()) {
            debug("Empty message. Final intent: " + UNKNOWN);
            return UNKNOWN;
        }

        if (looksLikeListTasksRequest(userMessage)) {
            debug("Final intent: " + LIST_TASKS + " using local fallback");
            return LIST_TASKS;
        }

        if (looksLikeCreateTaskRequest(userMessage)) {
            debug("Final intent: " + CREATE_TASK + " using local fallback");
            return CREATE_TASK;
        }

        debug("Final intent: " + UNKNOWN);
        return UNKNOWN;
    }

    private String detectIntentWithModel(String userMessage) {
        String prompt = "Classify the user's intent for a task management bot. "
                + "Reply only LIST_TASKS if the user wants to see, list, show, display, review, or check their tasks. "
                + "Reply only CREATE_TASK if the user wants to create, add, register, open, or file a task. "
                + "Reply only UNKNOWN for any other intent. "
                + "Message: " + userMessage;

        try {
            debug("Prompt sent to detect intent:");
            debug(prompt);

            String response = deepSeekService.generateText(prompt);
            debug("Raw API response for intent:");
            debug(response);

            String assistantText = extractAssistantText(response);
            debug("Assistant text extracted for intent:");
            debug(assistantText);

            String normalizedResponse = assistantText.toUpperCase(Locale.ROOT);

            if (normalizedResponse.contains(LIST_TASKS)) {
                return LIST_TASKS;
            }

            if (normalizedResponse.contains(CREATE_TASK)) {
                return CREATE_TASK;
            }
        } catch (Exception exc) {
            debug("AI intent detection failed: " + exc.getMessage());
            logger.warn("Could not detect intent with the AI model: {}", exc.getMessage());
        }

        return UNKNOWN;
    }

    private String extractAssistantText(String response) {
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

    private boolean looksLikeListTasksRequest(String userMessage) {
        String normalizedMessage = normalize(userMessage);
        boolean hasListVerb = normalizedMessage.contains("show")
                || normalizedMessage.contains("display")
                || normalizedMessage.contains("list")
                || normalizedMessage.contains("see")
                || normalizedMessage.contains("review")
                || normalizedMessage.contains("check")
                || normalizedMessage.contains("tell me")
                || normalizedMessage.contains("what do i have")
                || normalizedMessage.contains("muestra")
                || normalizedMessage.contains("mostrar")
                || normalizedMessage.contains("ensena")
                || normalizedMessage.contains("ver")
                || normalizedMessage.contains("lista")
                || normalizedMessage.contains("listar")
                || normalizedMessage.contains("consulta")
                || normalizedMessage.contains("consultar")
                || normalizedMessage.contains("dime");

        boolean hasTaskNoun = normalizedMessage.contains("task")
                || normalizedMessage.contains("tasks")
                || normalizedMessage.contains("pending")
                || normalizedMessage.contains("todo")
                || normalizedMessage.contains("to do")
                || normalizedMessage.contains("tarea")
                || normalizedMessage.contains("tareas")
                || normalizedMessage.contains("pendiente")
                || normalizedMessage.contains("pendientes");

        debug("Fallback LIST_TASKS. normalizedMessage=" + normalizedMessage
                + ", hasListVerb=" + hasListVerb
                + ", hasTaskNoun=" + hasTaskNoun);

        return hasListVerb && hasTaskNoun;
    }

    private boolean looksLikeCreateTaskRequest(String userMessage) {
        String normalizedMessage = normalize(userMessage);
        boolean hasCreateVerb = normalizedMessage.contains("create")
                || normalizedMessage.contains("add")
                || normalizedMessage.contains("register")
                || normalizedMessage.contains("open")
                || normalizedMessage.contains("file")
                || normalizedMessage.contains("make")
                || normalizedMessage.contains("crea")
                || normalizedMessage.contains("crear")
                || normalizedMessage.contains("agrega")
                || normalizedMessage.contains("agregar")
                || normalizedMessage.contains("registra")
                || normalizedMessage.contains("registrar")
                || normalizedMessage.contains("alta")
                || normalizedMessage.contains("abre");

        boolean hasTaskNoun = normalizedMessage.contains("task")
                || normalizedMessage.contains("pending")
                || normalizedMessage.contains("todo")
                || normalizedMessage.contains("to do")
                || normalizedMessage.contains("tarea")
                || normalizedMessage.contains("pendiente");

        debug("Fallback CREATE_TASK. normalizedMessage=" + normalizedMessage
                + ", hasCreateVerb=" + hasCreateVerb
                + ", hasTaskNoun=" + hasTaskNoun);

        return hasCreateVerb && hasTaskNoun;
    }

    private String normalize(String text) {
        String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return withoutAccents.toLowerCase(Locale.ROOT).trim();
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
            logger.warn("Could not write AI debug log: {}", exc.getMessage());
        }
    }
}

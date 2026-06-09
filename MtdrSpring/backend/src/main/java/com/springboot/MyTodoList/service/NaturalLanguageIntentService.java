package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.botai.IntentMatchResult;
import com.springboot.MyTodoList.botai.VectorIntentMatchingService;
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
    private static final double MIN_CONFIDENCE = 0.35;
    private static final String LIST_TASKS = "LIST_TASKS";
    private static final String CREATE_TASK = "CREATE_TASK";
    private static final String UNKNOWN = "UNKNOWN";
    private static final Path DEBUG_FILE = Paths.get("task-ia-debug.log");

    private final VectorIntentMatchingService vectorIntentMatchingService;

    public NaturalLanguageIntentService(VectorIntentMatchingService vectorIntentMatchingService) {
        this.vectorIntentMatchingService = vectorIntentMatchingService;
    }

    public String detectIntent(String userMessage) {
        debug("========== VECTOR INTENT DETECTION ==========");
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

        try {
            IntentMatchResult match = vectorIntentMatchingService.findBestIntent(userMessage).orElse(null);
            if (match != null) {
                debug("Vector match: intent=" + match.getIntentKey()
                        + ", confidence=" + match.getConfidence()
                        + ", example=" + match.getMatchedExample());
                if (match.getConfidence() >= MIN_CONFIDENCE) {
                    return toLegacyIntent(match.getIntentKey());
                }
            }
        } catch (Exception exc) {
            debug("Vector intent detection failed: " + exc.getMessage());
            logger.warn("Could not detect intent with vector matching: {}", exc.getMessage());
        }

        debug("Final intent: " + UNKNOWN);
        return UNKNOWN;
    }

    private String toLegacyIntent(String intentKey) {
        if ("TASK_LIST_MINE".equals(intentKey)) {
            return LIST_TASKS;
        }
        if ("TASK_CREATE".equals(intentKey)) {
            return CREATE_TASK;
        }
        return UNKNOWN;
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

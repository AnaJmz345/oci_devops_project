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
        debug("Mensaje recibido: " + userMessage);

        if (userMessage == null || userMessage.trim().isEmpty()) {
            debug("Mensaje vacio. Intencion final: " + UNKNOWN);
            return UNKNOWN;
        }

        String modelIntent = detectIntentWithModel(userMessage);
        debug("Intencion detectada por modelo: " + modelIntent);

        if (LIST_TASKS.equals(modelIntent)) {
            debug("Intencion final: " + LIST_TASKS + " usando IA");
            return LIST_TASKS;
        }

        if (CREATE_TASK.equals(modelIntent)) {
            debug("Intencion final: " + CREATE_TASK + " usando IA");
            return CREATE_TASK;
        }

        if (looksLikeListTasksRequest(userMessage)) {
            debug("Intencion final: " + LIST_TASKS + " usando fallback local");
            return LIST_TASKS;
        }

        if (looksLikeCreateTaskRequest(userMessage)) {
            debug("Intencion final: " + CREATE_TASK + " usando fallback local");
            return CREATE_TASK;
        }

        debug("Intencion final: " + UNKNOWN);
        return UNKNOWN;
    }

    private String detectIntentWithModel(String userMessage) {
        String prompt = "Clasifica la intencion del usuario para un bot de tareas. "
                + "Responde solo LIST_TASKS si quiere ver, listar, mostrar o consultar todas sus tareas. "
                + "Responde solo CREATE_TASK si quiere crear, registrar, agregar o dar de alta una tarea. "
                + "Responde solo UNKNOWN para cualquier otra intencion. "
                + "Mensaje: " + userMessage;

        try {
            debug("Prompt enviado para detectar intencion:");
            debug(prompt);

            String response = deepSeekService.generateText(prompt);
            debug("Respuesta cruda de la API para intencion:");
            debug(response);

            String assistantText = extractAssistantText(response);
            debug("Texto extraido del modelo para intencion:");
            debug(assistantText);

            String normalizedResponse = assistantText.toUpperCase(Locale.ROOT);

            if (normalizedResponse.contains(LIST_TASKS)) {
                return LIST_TASKS;
            }

            if (normalizedResponse.contains(CREATE_TASK)) {
                return CREATE_TASK;
            }
        } catch (Exception exc) {
            debug("Fallo la deteccion de intencion con IA: " + exc.getMessage());
            logger.warn("No se pudo detectar la intencion con el modelo de IA: {}", exc.getMessage());
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
        boolean hasListVerb = normalizedMessage.contains("muestra")
                || normalizedMessage.contains("mostrar")
                || normalizedMessage.contains("ensena")
                || normalizedMessage.contains("ver")
                || normalizedMessage.contains("lista")
                || normalizedMessage.contains("listar")
                || normalizedMessage.contains("consulta")
                || normalizedMessage.contains("consultar")
                || normalizedMessage.contains("dime");

        boolean hasTaskNoun = normalizedMessage.contains("tarea")
                || normalizedMessage.contains("tareas")
                || normalizedMessage.contains("pendiente")
                || normalizedMessage.contains("pendientes")
                || normalizedMessage.contains("todo")
                || normalizedMessage.contains("to do");

        debug("Fallback LIST_TASKS. normalizedMessage=" + normalizedMessage
                + ", hasListVerb=" + hasListVerb
                + ", hasTaskNoun=" + hasTaskNoun);

        return hasListVerb && hasTaskNoun;
    }

    private boolean looksLikeCreateTaskRequest(String userMessage) {
        String normalizedMessage = normalize(userMessage);
        boolean hasCreateVerb = normalizedMessage.contains("crea")
                || normalizedMessage.contains("crear")
                || normalizedMessage.contains("agrega")
                || normalizedMessage.contains("agregar")
                || normalizedMessage.contains("registra")
                || normalizedMessage.contains("registrar")
                || normalizedMessage.contains("alta")
                || normalizedMessage.contains("abre");

        boolean hasTaskNoun = normalizedMessage.contains("tarea")
                || normalizedMessage.contains("task")
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
            logger.warn("No se pudo escribir debug IA: {}", exc.getMessage());
        }
    }
}

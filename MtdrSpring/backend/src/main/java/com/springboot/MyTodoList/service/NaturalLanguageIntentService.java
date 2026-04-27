package com.springboot.MyTodoList.service;

import java.text.Normalizer;
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

    private final DeepSeekService deepSeekService;

    public NaturalLanguageIntentService(DeepSeekService deepSeekService) {
        this.deepSeekService = deepSeekService;
    }

    public String detectIntent(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return UNKNOWN;
        }

        String modelIntent = detectIntentWithModel(userMessage);
        if (LIST_TASKS.equals(modelIntent)) {
            return LIST_TASKS;
        }

        if (CREATE_TASK.equals(modelIntent)) {
            return CREATE_TASK;
        }

        if (looksLikeListTasksRequest(userMessage)) {
            return LIST_TASKS;
        }

        if (looksLikeCreateTaskRequest(userMessage)) {
            return CREATE_TASK;
        }

        return UNKNOWN;
    }

    private String detectIntentWithModel(String userMessage) {
        String prompt = "Clasifica la intencion del usuario para un bot de tareas. "
                + "Responde solo LIST_TASKS si quiere ver, listar, mostrar o consultar todas sus tareas. "
                + "Responde solo CREATE_TASK si quiere crear, registrar, agregar o dar de alta una tarea. "
                + "Responde solo UNKNOWN para cualquier otra intencion. "
                + "Mensaje: " + userMessage;

        try {
            String response = deepSeekService.generateText(prompt);
            if (response != null && response.toUpperCase(Locale.ROOT).contains(LIST_TASKS)) {
                return LIST_TASKS;
            }
            if (response != null && response.toUpperCase(Locale.ROOT).contains(CREATE_TASK)) {
                return CREATE_TASK;
            }
        } catch (Exception exc) {
            logger.warn("No se pudo detectar la intencion con el modelo de IA: {}", exc.getMessage());
        }

        return UNKNOWN;
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
                || normalizedMessage.contains("alta");

        boolean hasTaskNoun = normalizedMessage.contains("tarea")
                || normalizedMessage.contains("task");

        return hasCreateVerb && hasTaskNoun;
    }

    private String normalize(String text) {
        String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return withoutAccents.toLowerCase(Locale.ROOT).trim();
    }
}

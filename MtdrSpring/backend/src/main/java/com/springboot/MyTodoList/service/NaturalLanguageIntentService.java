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
    private static final String UNKNOWN = "UNKNOWN";

    private final DeepSeekService deepSeekService;

    public NaturalLanguageIntentService(DeepSeekService deepSeekService) {
        this.deepSeekService = deepSeekService;
    }

    public String detectIntent(String userMessage) {
        System.out.println("NL DEBUG - detectIntent() recibio: " + userMessage);

        if (userMessage == null || userMessage.trim().isEmpty()) {
            System.out.println("NL DEBUG - mensaje vacio, regresa UNKNOWN");
            return UNKNOWN;
        }

        String modelIntent = detectIntentWithModel(userMessage);
        if (LIST_TASKS.equals(modelIntent)) {
            System.out.println("NL DEBUG - intencion detectada por IA: LIST_TASKS");
            return LIST_TASKS;
        }

        if (looksLikeListTasksRequest(userMessage)) {
            System.out.println("NL DEBUG - intencion detectada por fallback: LIST_TASKS");
            return LIST_TASKS;
        }

        System.out.println("NL DEBUG - no se detecto intencion, regresa UNKNOWN");
        return UNKNOWN;
    }

    private String detectIntentWithModel(String userMessage) {
        String prompt = "Clasifica la intencion del usuario para un bot de tareas. "
                + "Responde solo LIST_TASKS si quiere ver, listar, mostrar o consultar todas sus tareas. "
                + "Responde solo UNKNOWN para cualquier otra intencion. "
                + "Mensaje: " + userMessage;

        try {
            System.out.println("NL DEBUG - enviando prompt al modelo IA");

            String response = deepSeekService.generateText(prompt);
            System.out.println("NL DEBUG - respuesta cruda del modelo IA: " + response);

            if (response != null && response.toUpperCase(Locale.ROOT).contains(LIST_TASKS)) {
                System.out.println("NL DEBUG - el modelo IA devolvio LIST_TASKS");
                return LIST_TASKS;
            }

            System.out.println("NL DEBUG - el modelo IA NO devolvio LIST_TASKS");
        } catch (Exception exc) {
            System.out.println("NL DEBUG - fallo llamada a IA: " + exc.getMessage());
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

        System.out.println("NL DEBUG - fallback normalizado: " + normalizedMessage);
        System.out.println("NL DEBUG - fallback hasListVerb: " + hasListVerb);
        System.out.println("NL DEBUG - fallback hasTaskNoun: " + hasTaskNoun);

        return hasListVerb && hasTaskNoun;
    }

    private String normalize(String text) {
        String withoutAccents = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return withoutAccents.toLowerCase(Locale.ROOT).trim();
    }
}

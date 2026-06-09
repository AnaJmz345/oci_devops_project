# Rediseño del ChatBot sin APIs externas

Proyecto: Reto Oracle / MyTodoList / Vantage  
Backend actual: Spring Boot, Telegram long polling, Oracle Autonomous Database, Docker, Kubernetes y servicios internos Java.

## 1. Arquitectura propuesta

### Flujo anterior

1. Telegram recibe un texto libre.
2. `ToDoItemBotController` crea `BotActions`.
3. `NaturalLanguageIntentService` o `TaskNaturalLanguageService` preparan prompts.
4. `DeepSeekService` llama una API externa compatible con OpenAI/Gemini usando `HttpPost`.
5. La respuesta textual/JSON se interpreta y se convierte en comando.
6. `BotActions` ejecuta operaciones sobre `ToDoItemService`, `TaskService`, `UserService` y `SprintService`.

Problema: el backend depende funcionalmente de una API externa para clasificar intención o extraer datos. Esto genera costo, exposición de datos, variabilidad de respuesta y secretos externos.

### Flujo nuevo con Oracle AI Vector Search

1. Telegram recibe el texto.
2. `BotMessageProcessor` normaliza el mensaje.
3. `IntentEmbeddingService` genera una representación semántica local:
   - ideal: `DBMS_VECTOR.UTL_TO_EMBEDDING` con modelo ONNX cargado en Oracle AI Database;
   - inicial: vector determinístico local sin APIs externas.
4. `VectorSearchService` compara el mensaje contra ejemplos del catálogo guardado en Oracle (`BOT_INTENT_EMBEDDINGS`).
5. `IntentCatalogService` recupera la intención permitida (`BOT_INTENTS`).
6. `ActionParameterExtractor` extrae parámetros con reglas seguras, no con SQL dinámico.
7. `ConfirmationService` solicita confirmación para cambios destructivos o escrituras.
8. `ActionRouterService` enruta a `BotActionExecutor`.
9. `BotActionExecutor` llama servicios existentes: `ToDoItemService`, `TaskService`, `UserService`, `SprintService`, `BugService`.
10. `BotActionAuditService` registra mensaje, intención, confianza, usuario Telegram, parámetros, resultado y error.
11. Telegram responde al usuario.

La IA no ejecuta acciones. Solo clasifica el mensaje hacia una intención permitida y parámetros validados.

## 2. Componentes Spring Boot propuestos

Paquete base recomendado: `com.springboot.MyTodoList.botai`

| Clase / paquete | Responsabilidad |
| --- | --- |
| `botai.processor.BotMessageProcessor` | Orquesta el flujo completo de Telegram. Devuelve texto listo para responder. |
| `botai.embedding.IntentEmbeddingService` | Contrato para generar embeddings. Implementaciones: Oracle ONNX y local simple. |
| `botai.embedding.OracleIntentEmbeddingService` | Usa `JdbcTemplate` y `DBMS_VECTOR.UTL_TO_EMBEDDING`. |
| `botai.embedding.LocalHashEmbeddingService` | Opción inicial sin APIs externas. Genera vector estable por tokens. |
| `botai.catalog.IntentCatalogService` | Lee catálogo de intenciones, ejemplos, roles y configuración. |
| `botai.search.VectorSearchService` | Ejecuta búsqueda por similitud en Oracle; si no hay VECTOR, usa cosine similarity local sobre vectores JSON. |
| `botai.router.ActionRouterService` | Decide qué executor usar para cada `intent_key`. |
| `botai.executor.BotActionExecutor` | Interfaz para acciones internas seguras. |
| `botai.executor.TaskActionExecutor` | Consulta, crea, elimina y actualiza tareas usando `TaskService`/`ToDoItemService`. |
| `botai.executor.SprintActionExecutor` | Consulta sprints usando `SprintService`. |
| `botai.executor.BugActionExecutor` | Consulta bugs usando `BugService`. |
| `botai.executor.KpiActionExecutor` | Calcula KPIs y tiempos usando `TaskService` y asignaciones. |
| `botai.params.ActionParameterExtractor` | Extrae `taskId`, `status`, `userName`, `email`, `sprintId`, etc. con regex/listas blancas. |
| `botai.confirmation.ConfirmationService` | Guarda contexto pendiente y valida respuestas `si/no`, `confirmar/cancelar`. |
| `botai.audit.BotActionAuditService` | Registra auditoría en `BOT_ACTION_AUDIT`. |
| `botai.dto.IntentMatchResult` | Resultado de similitud: intención, score, ejemplo, requiere confirmación. |
| `botai.dto.BotActionRequest` | Entrada normalizada hacia el router. |
| `botai.dto.BotActionResponse` | Respuesta de acción: mensaje, estado, requiere confirmación. |
| `botai.model.BotIntent` | Entidad JPA para `BOT_INTENTS`. |
| `botai.model.BotIntentExample` | Entidad JPA para `BOT_INTENT_EXAMPLES`. |
| `botai.model.BotConversationContext` | Entidad para confirmaciones o flujo multi-turno. |
| `botai.model.BotActionAudit` | Entidad de auditoría. |

## 3. Catálogo mínimo de intenciones

| intent_key | Descripción | Ejemplos ES | Acción interna | Parámetros | Rol | Confirma |
| --- | --- | --- | --- | --- | --- | --- |
| `TASK_LIST_MINE` | Consultar mis tareas | "muéstrame mis tareas", "qué pendientes tengo", "lista mis tareas" | `TaskActionExecutor.listMine` o `BotActions.fnListAll` | `telegramUserId` | `USER` | No |
| `TASK_LIST_BY_USER` | Consultar tareas de un usuario | "qué tareas tiene Juan", "tareas de ana@x.com" | `TaskActionExecutor.listByUser` | `userName` o `email` | `MANAGER` | No |
| `TASK_CREATE` | Crear tarea | "agrega una tarea para terminar el login", "crea tarea revisar bug para sprint 2" | `TaskActionExecutor.create` | `taskName`, `dueDate?`, `assigneeEmail?`, `sprintId?` | `MANAGER` | Sí |
| `TASK_DELETE` | Eliminar tarea | "elimina la tarea 5", "borra task 12" | `TaskActionExecutor.delete` | `taskId` | `MANAGER` | Sí |
| `TASK_UPDATE_STATUS` | Cambiar estado | "marca la tarea 5 como terminada", "pon la tarea 9 en progreso" | `TaskActionExecutor.updateStatus` | `taskId`, `status` | `USER` | Sí |
| `SPRINT_LIST` | Consultar sprints | "qué sprints están activos", "lista los sprints" | `SprintActionExecutor.list` | `status?` | `USER` | No |
| `BUG_LIST` | Consultar bugs | "muéstrame los bugs abiertos", "bugs de la tarea 7" | `BugActionExecutor.list` | `status?`, `taskId?` | `USER` | No |
| `ISSUE_LIST` | Consultar issues/tareas tipo issue | "muéstrame issues abiertos", "issues del sprint 1" | `TaskActionExecutor.listIssues` | `status?`, `sprintId?` | `USER` | No |
| `KPI_SUMMARY` | Consultar KPIs generales | "dame KPIs", "cómo va el proyecto" | `KpiActionExecutor.summary` | `sprintId?` | `MANAGER` | No |
| `TIME_ESTIMATED_VS_REAL` | Comparar tiempo real vs estimado | "cuánto tiempo real llevamos contra el estimado" | `KpiActionExecutor.estimatedVsReal` | `sprintId?`, `user?` | `MANAGER` | No |
| `HELP` | Ayuda | "ayuda", "comandos disponibles", "qué puedes hacer" | `HelpActionExecutor.help` | Ninguno | `USER` | No |
| `FALLBACK` | No entendido | cualquier mensaje con baja confianza | `FallbackActionExecutor` | `originalMessage` | `USER` | No |

Roles sugeridos: `USER` puede consultar y actualizar tareas propias; `MANAGER` puede crear, eliminar, consultar por usuario y ver KPIs. Ajustar a los roles reales de `VANTAGE_USER.ROLE`.

## 4. Tablas Oracle

Las tablas están en scripts separados bajo `docs/sql`.

Notas:

- `BOT_INTENT_EMBEDDINGS.EMBEDDING_VECTOR` usa `VECTOR(384, FLOAT32)` para modelos tipo MiniLM. Si el modelo ONNX genera otra dimensión, cambiar a esa dimensión o usar `VECTOR` sin dimensión explícita.
- `EMBEDDING_JSON` permite la fase inicial sin VECTOR real o como respaldo desde Java.
- `PARAMETERS_SCHEMA` y `PARAMETERS_JSON` usan `CLOB CHECK (... IS JSON)` por compatibilidad amplia con Oracle.
- La auditoría registra intención y resultado, no secretos.

## 5. Generación de embeddings

### Opción A: ideal con Oracle AI Database

1. Elegir modelo de embeddings pequeño y explicable, por ejemplo `sentence-transformers/all-MiniLM-L6-v2` o modelo preconstruido compatible con Oracle.
2. Convertir/cargar ONNX en Oracle con herramientas de Oracle Machine Learning.
3. Generar embeddings dentro de Oracle:

```sql
SELECT DBMS_VECTOR.UTL_TO_EMBEDDING(
  'muestrame mis tareas',
  JSON('{"provider":"database","model":"doc_model"}')
) AS embedding
FROM dual;
```

4. Guardar embedding de cada ejemplo en `BOT_INTENT_EMBEDDINGS`.
5. Para cada mensaje del usuario, generar embedding con el mismo modelo y buscar el ejemplo más cercano usando `VECTOR_DISTANCE(..., COSINE)`.

Ventaja: datos y cómputo permanecen dentro del ecosistema Oracle. Es el flujo más alineado con Oracle AI Vector Search.

### Opción B: inicial simple sin APIs externas

Mientras el equipo configura ONNX:

1. Normalizar texto: minúsculas, quitar acentos, quitar puntuación.
2. Tokenizar.
3. Crear vector fijo de 384 dimensiones con hashing determinístico por token.
4. Normalizar el vector.
5. Guardar como JSON en `EMBEDDING_JSON`.
6. Comparar similitud coseno en Java o en SQL auxiliar.

No es tan semántico como ONNX, pero funciona para un catálogo pequeño de intenciones con muchos ejemplos en español. Sirve para eliminar inmediatamente la API externa y avanzar incrementalmente.

## 6. Flujo completo del mensaje Telegram

1. `ToDoItemBotController.consume(Update)` recibe texto y chat ID.
2. `BotMessageProcessor.process(chatId, telegramUserName, text)` limpia texto.
3. Si hay confirmación pendiente en `BOT_CONVERSATION_CONTEXT`, valida `si/no`.
4. `IntentEmbeddingService.embed(normalizedText)` genera vector.
5. `VectorSearchService.findBestIntent(vector, normalizedText)` obtiene top K.
6. Se valida `confidence >= 0.72`; si no, `FALLBACK`.
7. `ActionParameterExtractor.extract(intentKey, text)` extrae parámetros por reglas.
8. `PermissionService` valida rol permitido.
9. Si `requires_confirmation = 'Y'`, guarda contexto y responde resumen.
10. Si no requiere confirmación, `ActionRouterService.route(...)` ejecuta.
11. `BotActionAuditService.save(...)` registra todo.
12. Se devuelve mensaje a Telegram.

## 7. Clases actuales a modificar o sustituir

### Mantener

- `ToDoItemBotController`: conservar como entrada Telegram, pero inyectar `BotMessageProcessor`.
- `BotClient`, `BotHelper`, `BotCommands`, `BotLabels`, `BotMessages`: conservar. Solo agregar comandos si se desea.
- `ToDoItemService`, `TaskService`, `UserService`, `SprintService`, `BugService`: conservar como ejecutores reales.
- `TelegramTaskDraftService`: puede mantenerse para creación multi-turno de tareas.

### Sustituir gradualmente

- `DeepSeekConfig`: retirar en Fase 5. En Fase 2 puede quedarse sin usarse.
- `DeepSeekService`: reemplazar por `IntentEmbeddingService` y `VectorSearchService`. No debe llamarse desde producción.
- `NaturalLanguageIntentService`: reemplazar por `BotMessageProcessor` + `VectorSearchService`. Si se conserva temporalmente, debe dejar de depender de `DeepSeekService`.
- `TaskNaturalLanguageService`: conservar sus extractores locales (`regex`, fechas, email, sprint), eliminar `extractTaskDraftWithAi` o dejarlo obsoleto sin llamadas.
- `BotActions.fnLLM()`: eliminar o convertir en ayuda local. Actualmente llama `deepSeekService.generateText`.
- `BotActions.translateNaturalLanguageIntent()`: reemplazar por `BotMessageProcessor`; no mutar `requestText` con resultados de IA externa.
- `ToDoItemBotController` constructor: quitar `DeepSeekService` e inyectar `BotMessageProcessor`.
- `MyTodoListApplication`: quitar `@Import(DeepSeekConfig.class)`.
- `application.properties`: quitar `deepseek.api.*` y no guardar token Telegram real en código.
- `pom.xml`: revisar si `httpclient5` y `java-dotenv` siguen siendo necesarios. Si solo se usaban para DeepSeek, eliminarlos.

### Integración sugerida en `ToDoItemBotController`

```java
@Component
public class ToDoItemBotController implements SpringLongPollingBot, LongPollingSingleThreadUpdateConsumer {
    private final BotMessageProcessor botMessageProcessor;
    private final TelegramClient telegramClient;

    public ToDoItemBotController(BotProps botProps, BotMessageProcessor botMessageProcessor) {
        this.botMessageProcessor = botMessageProcessor;
        this.telegramClient = new OkHttpTelegramClient(botProps.getToken());
    }

    @Override
    public void consume(Update update) {
        if (!update.hasMessage() || !update.getMessage().hasText()) {
            return;
        }
        long chatId = update.getMessage().getChatId();
        String username = update.getMessage().getFrom() == null ? null : update.getMessage().getFrom().getUserName();
        String response = botMessageProcessor.process(chatId, username, update.getMessage().getText());
        BotHelper.sendMessageToTelegram(chatId, response, telegramClient, null);
    }
}
```

## 8. Código base Java

### DTOs

```java
package com.springboot.MyTodoList.botai.dto;

import java.util.Map;

public record IntentMatchResult(
        String intentKey,
        String description,
        double confidence,
        String matchedExample,
        String internalAction,
        String allowedRole,
        boolean requiresConfirmation
) {}

public record BotActionRequest(
        Long telegramChatId,
        String telegramUsername,
        String originalText,
        String normalizedText,
        String intentKey,
        Map<String, Object> parameters
) {}

public record BotActionResponse(boolean success, String message) {}
```

### Entidad principal

```java
@Entity
@Table(name = "BOT_INTENTS", schema = "VANTAGE")
public class BotIntent {
    @Id
    @Column(name = "INTENT_KEY")
    private String intentKey;

    @Column(name = "DESCRIPTION")
    private String description;

    @Column(name = "INTERNAL_ACTION")
    private String internalAction;

    @Column(name = "ALLOWED_ROLE")
    private String allowedRole;

    @Column(name = "REQUIRES_CONFIRMATION")
    private String requiresConfirmation;

    @Lob
    @Column(name = "PARAMETERS_SCHEMA")
    private String parametersSchema;

    @Column(name = "ACTIVE")
    private String active;

    public boolean requiresConfirmation() {
        return "Y".equalsIgnoreCase(requiresConfirmation);
    }
}
```

### Repositories

```java
public interface BotIntentRepository extends JpaRepository<BotIntent, String> {
    List<BotIntent> findByActive(String active);
}

public interface BotConversationContextRepository extends JpaRepository<BotConversationContext, Long> {
    Optional<BotConversationContext> findFirstByTelegramChatIdAndStatusOrderByCreatedAtDesc(
            Long telegramChatId, String status);
}

public interface BotActionAuditRepository extends JpaRepository<BotActionAudit, Long> {}
```

### Embedding service

```java
public interface IntentEmbeddingService {
    float[] embed(String text);
}

@Service
@Profile("local-embeddings")
public class LocalHashEmbeddingService implements IntentEmbeddingService {
    private static final int DIMENSIONS = 384;

    @Override
    public float[] embed(String text) {
        float[] vector = new float[DIMENSIONS];
        for (String token : normalize(text).split("\\s+")) {
            if (token.isBlank()) continue;
            int index = Math.floorMod(token.hashCode(), DIMENSIONS);
            vector[index] += 1.0f;
        }
        normalizeVector(vector);
        return vector;
    }

    private String normalize(String text) {
        return java.text.Normalizer.normalize(text == null ? "" : text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9@._\\s-]", " ")
                .toLowerCase()
                .trim();
    }

    private void normalizeVector(float[] vector) {
        double sum = 0;
        for (float value : vector) sum += value * value;
        double norm = Math.sqrt(sum);
        if (norm == 0) return;
        for (int i = 0; i < vector.length; i++) vector[i] = (float) (vector[i] / norm);
    }
}
```

### Oracle vector search

```java
@Service
public class VectorSearchService {
    private final JdbcTemplate jdbcTemplate;

    public VectorSearchService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<IntentMatchResult> findBestIntent(String queryVectorLiteral) {
        String sql = """
            SELECT i.intent_key,
                   i.description,
                   i.internal_action,
                   i.allowed_role,
                   i.requires_confirmation,
                   e.example_text,
                   1 - VECTOR_DISTANCE(e.embedding_vector, TO_VECTOR(?), COSINE) AS confidence
            FROM VANTAGE.bot_intent_embeddings e
            JOIN VANTAGE.bot_intent_examples x ON x.example_id = e.example_id
            JOIN VANTAGE.bot_intents i ON i.intent_key = x.intent_key
            WHERE i.active = 'Y'
            ORDER BY VECTOR_DISTANCE(e.embedding_vector, TO_VECTOR(?), COSINE)
            FETCH FIRST 1 ROW ONLY
            """;

        List<IntentMatchResult> results = jdbcTemplate.query(sql, (rs, rowNum) ->
                new IntentMatchResult(
                        rs.getString("intent_key"),
                        rs.getString("description"),
                        rs.getDouble("confidence"),
                        rs.getString("example_text"),
                        rs.getString("internal_action"),
                        rs.getString("allowed_role"),
                        "Y".equalsIgnoreCase(rs.getString("requires_confirmation"))
                ), queryVectorLiteral, queryVectorLiteral);

        return results.stream().findFirst();
    }
}
```

### Parameter extractor

```java
@Service
public class ActionParameterExtractor {
    private static final Pattern NUMBER = Pattern.compile("\\d+");
    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    public Map<String, Object> extract(String intentKey, String text) {
        Map<String, Object> params = new HashMap<>();
        if ("TASK_DELETE".equals(intentKey) || "TASK_UPDATE_STATUS".equals(intentKey)) {
            firstNumber(text).ifPresent(id -> params.put("taskId", id));
        }
        if ("TASK_UPDATE_STATUS".equals(intentKey)) {
            params.put("status", detectStatus(text));
        }
        if ("TASK_LIST_BY_USER".equals(intentKey)) {
            firstEmail(text).ifPresent(email -> params.put("email", email));
            if (!params.containsKey("email")) params.put("userName", extractNameCandidate(text));
        }
        if ("TASK_CREATE".equals(intentKey)) {
            params.put("taskName", extractTaskName(text));
            firstEmail(text).ifPresent(email -> params.put("assigneeEmail", email));
        }
        return params;
    }

    private Optional<Long> firstNumber(String text) {
        Matcher matcher = NUMBER.matcher(text == null ? "" : text);
        return matcher.find() ? Optional.of(Long.valueOf(matcher.group())) : Optional.empty();
    }

    private Optional<String> firstEmail(String text) {
        Matcher matcher = EMAIL.matcher(text == null ? "" : text);
        return matcher.find() ? Optional.of(matcher.group()) : Optional.empty();
    }

    private String detectStatus(String text) {
        String value = text == null ? "" : text.toLowerCase();
        if (value.contains("terminada") || value.contains("done") || value.contains("completada")) return "DONE";
        if (value.contains("progreso")) return "IN_PROGRESS";
        return "TODO";
    }
}
```

### Processor y router

```java
@Service
public class BotMessageProcessor {
    private static final double MIN_CONFIDENCE = 0.72;

    private final IntentEmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;
    private final ActionParameterExtractor parameterExtractor;
    private final ConfirmationService confirmationService;
    private final ActionRouterService actionRouterService;
    private final BotActionAuditService auditService;

    public String process(Long chatId, String username, String text) {
        if (confirmationService.hasPending(chatId)) {
            return confirmationService.handleConfirmation(chatId, text);
        }

        String normalized = normalize(text);
        float[] vector = embeddingService.embed(normalized);
        String vectorLiteral = toVectorLiteral(vector);

        IntentMatchResult match = vectorSearchService.findBestIntent(vectorLiteral)
                .orElse(fallback());

        if (match.confidence() < MIN_CONFIDENCE) {
            auditService.record(chatId, username, text, "FALLBACK", match.confidence(), null, "LOW_CONFIDENCE", null);
            return "No entendi bien. Escribe 'ayuda' para ver ejemplos de comandos.";
        }

        Map<String, Object> params = parameterExtractor.extract(match.intentKey(), text);
        BotActionRequest request = new BotActionRequest(chatId, username, text, normalized, match.intentKey(), params);

        if (match.requiresConfirmation()) {
            confirmationService.savePending(request);
            return "Voy a ejecutar: " + match.description() + " con " + params + ". Responde 'confirmar' o 'cancelar'.";
        }

        BotActionResponse response = actionRouterService.route(request);
        auditService.record(chatId, username, text, match.intentKey(), match.confidence(), params,
                response.success() ? "SUCCESS" : "ERROR", response.message());
        return response.message();
    }
}
```

### Executor seguro

```java
@Service
public class TaskActionExecutor implements BotActionExecutor {
    private final TaskService taskService;
    private final UserService userService;

    public boolean supports(String intentKey) {
        return intentKey.startsWith("TASK_") || "ISSUE_LIST".equals(intentKey);
    }

    public BotActionResponse execute(BotActionRequest request) {
        return switch (request.intentKey()) {
            case "TASK_LIST_MINE" -> listMine(request);
            case "TASK_DELETE" -> deleteTask(request);
            case "TASK_UPDATE_STATUS" -> updateStatus(request);
            default -> new BotActionResponse(false, "Accion de tareas no soportada todavia.");
        };
    }

    private BotActionResponse deleteTask(BotActionRequest request) {
        Long taskId = (Long) request.parameters().get("taskId");
        if (taskId == null) return new BotActionResponse(false, "Necesito el ID de la tarea.");
        boolean deleted = taskService.deleteTask(taskId);
        return new BotActionResponse(deleted, deleted ? "Tarea eliminada." : "No pude eliminar la tarea.");
    }

    private BotActionResponse updateStatus(BotActionRequest request) {
        Long taskId = (Long) request.parameters().get("taskId");
        String status = (String) request.parameters().get("status");
        if (taskId == null) return new BotActionResponse(false, "Necesito el ID de la tarea.");
        Task update = new Task();
        update.setStatus(status);
        Task updated = taskService.updateTask(taskId, update);
        return updated == null
                ? new BotActionResponse(false, "No encontre la tarea.")
                : new BotActionResponse(true, "Tarea " + taskId + " actualizada a " + status + ".");
    }
}
```

## 9. Plan de migración seguro

### Fase 1: tablas y catálogo

- Ejecutar `01_create_bot_ai_tables.sql`.
- Ejecutar `02_seed_bot_intents.sql`.
- Ejecutar `03_seed_bot_intent_examples.sql`.
- No tocar todavía el flujo actual.

### Fase 2: servicios internos en paralelo

- Agregar paquete `botai`.
- Activar `LocalHashEmbeddingService` con profile `local-embeddings`.
- Crear endpoint o test de consola para probar `BotMessageProcessor` sin Telegram.

### Fase 3: pruebas con mensajes reales

- Tomar mensajes reales de Telegram y medir intención/score.
- Agregar ejemplos a `BOT_INTENT_EXAMPLES`.
- Ajustar umbral `MIN_CONFIDENCE`.

### Fase 4: reemplazar DeepSeek

- Modificar `ToDoItemBotController` para llamar `BotMessageProcessor`.
- Mantener `BotActions` para botones/comandos existentes o migrarlos al router.
- Desactivar `fnLLM`.

### Fase 5: eliminar dependencias externas

- Borrar `DeepSeekConfig`.
- Borrar o archivar `DeepSeekService`.
- Quitar `@Import(DeepSeekConfig.class)`.
- Quitar `deepseek.api.*`.
- Revisar `pom.xml`: eliminar `httpclient5` y `java-dotenv` si ya no se usan.
- Quitar secretos reales del repositorio.

### Fase 6: pruebas finales y Kubernetes

- Build Maven.
- Imagen Docker.
- Deploy a OKE.
- Revisar logs: no debe haber llamadas HTTP a APIs de IA.
- Probar Telegram end-to-end.

## 10. Criterios de prueba

### Código

```powershell
rg -n "DeepSeek|deepseek|OpenAI|Gemini|generativelanguage|api.openai|GEMINI_API_KEY|generateText|HttpPost" .
```

Resultado esperado: solo documentación histórica o nada en `src/main/java`.

### `pom.xml`

- Sin dependencias usadas exclusivamente por la API externa.
- `telegrambots-*`, `ojdbc11-production`, `spring-boot-starter-data-jpa` se conservan.

### Variables de entorno

- No `DEEPSEEK_API_KEY`.
- No `GEMINI_API_KEY`.
- No `OPENAI_API_KEY`.
- Solo Telegram, datasource Oracle y configuración local de embeddings.

### Logs

- No debe aparecer "Calling LLM".
- No debe aparecer URL de Google/OpenAI/DeepSeek.
- Debe aparecer auditoría interna con `intent_key`, `confidence`, `status`.

### Telegram

Probar:

- "muéstrame mis tareas" -> lista tareas.
- "agrega una tarea para terminar el login" -> pide datos faltantes o confirmación.
- "marca la tarea 5 como terminada" -> pide confirmación y actualiza vía servicio.
- "qué sprints están activos" -> consulta `SprintService`.
- "muéstrame los bugs abiertos" -> consulta `BugService`.
- "cuánto tiempo real llevamos contra el estimado" -> calcula KPI interno.

### Base de datos

- `BOT_ACTION_AUDIT` registra cada intento.
- `BOT_CONVERSATION_CONTEXT` guarda confirmaciones pendientes.
- `BOT_INTENT_EMBEDDINGS` contiene vectores para cada ejemplo activo.

### Seguridad

- Mensajes no generan SQL dinámico.
- Intenciones no incluidas en catálogo no se ejecutan.
- Escrituras requieren confirmación.
- Roles se validan antes de ejecutar.
- Parámetros se validan por tipo y contra servicios/repositorios.

## 11. Explicación para Oracle

La nueva arquitectura elimina llamadas a APIs externas de IA y mueve la interpretación del lenguaje natural a un catálogo controlado de intenciones con embeddings almacenados en Oracle Autonomous Database. El bot ya no envía mensajes de usuarios ni datos del proyecto a proveedores externos; solo convierte el texto en una intención permitida y ejecuta acciones mediante servicios internos existentes. Esto reduce costos variables por token o request, mejora la seguridad al mantener los datos dentro del ecosistema Oracle y hace que el comportamiento sea auditable, predecible y fácil de explicar para estudiantes y evaluadores técnicos.

## 12. Referencias Oracle usadas

- Oracle documenta `DBMS_VECTOR.UTL_TO_EMBEDDING` para generar embeddings desde texto con un modelo ONNX cargado en la base usando `provider: database`.
- Oracle AI Vector Search permite almacenar embeddings en columnas `VECTOR` y usar índices HNSW/IVF para búsquedas por similitud.
- `DBMS_VECTOR.CREATE_INDEX` permite crear índices vectoriales con organización `INMEMORY NEIGHBOR GRAPH` y métricas como `COSINE` o `EUCLIDEAN`.

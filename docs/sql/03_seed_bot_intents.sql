INSERT INTO VANTAGE.BOT_INTENTS
(INTENT_KEY, DESCRIPTION, INTERNAL_ACTION, PARAMETERS_SCHEMA, ALLOWED_ROLE, REQUIRES_CONFIRMATION)
VALUES
('TASK_LIST_MINE', 'Consultar mis tareas', 'TASK_LIST_MINE',
 '{"required":[],"properties":{"telegramUserId":"number"}}', 'USER', 'N');

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('TASK_LIST_BY_USER', 'Consultar tareas de un usuario', 'TASK_LIST_BY_USER',
 '{"required":["user"],"properties":{"email":"string","userName":"string"}}',
 'MANAGER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('TASK_CREATE', 'Crear una tarea', 'TASK_CREATE',
 '{"required":["taskName"],"properties":{"taskName":"string","dueDate":"date","assigneeEmail":"string","sprintId":"number"}}',
 'MANAGER', 'Y', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('TASK_DELETE', 'Eliminar una tarea', 'TASK_DELETE',
 '{"required":["taskId"],"properties":{"taskId":"number"}}',
 'MANAGER', 'Y', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('TASK_UPDATE_STATUS', 'Actualizar estado de una tarea', 'TASK_UPDATE_STATUS',
 '{"required":["taskId","status"],"properties":{"taskId":"number","status":"TODO|IN_PROGRESS|DONE"}}',
 'USER', 'Y', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('SPRINT_LIST', 'Consultar sprints', 'SPRINT_LIST',
 '{"required":[],"properties":{"status":"string"}}',
 'USER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('BUG_LIST', 'Consultar bugs', 'BUG_LIST',
 '{"required":[],"properties":{"status":"string","taskId":"number"}}',
 'USER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('ISSUE_LIST', 'Consultar issues', 'ISSUE_LIST',
 '{"required":[],"properties":{"status":"string","sprintId":"number"}}',
 'USER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('KPI_SUMMARY', 'Consultar KPIs del proyecto', 'KPI_SUMMARY',
 '{"required":[],"properties":{"sprintId":"number"}}',
 'MANAGER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('TIME_ESTIMATED_VS_REAL', 'Consultar tiempo estimado contra tiempo real', 'TIME_ESTIMATED_VS_REAL',
 '{"required":[],"properties":{"sprintId":"number","email":"string"}}',
 'MANAGER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('HELP', 'Mostrar ayuda y comandos disponibles', 'HELP',
 '{"required":[],"properties":{}}',
 'USER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

INSERT INTO VANTAGE.BOT_INTENTS VALUES
('FALLBACK', 'Mensaje no entendido', 'FALLBACK',
 '{"required":[],"properties":{"originalMessage":"string"}}',
 'USER', 'N', 'Y', CURRENT_TIMESTAMP, NULL);

COMMIT;

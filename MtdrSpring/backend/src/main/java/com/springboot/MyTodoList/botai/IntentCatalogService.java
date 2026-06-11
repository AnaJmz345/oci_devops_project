package com.springboot.MyTodoList.botai;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class IntentCatalogService {
    private final List<IntentExample> examples;

    public IntentCatalogService() {
        List<IntentExample> seed = new ArrayList<>();
        add(seed, "TASK_LIST_MINE", "muestrame mis tareas", "que pendientes tengo", "lista mis tareas",
                "ver mis tareas", "consultar mis pendientes");
        add(seed, "TASK_LIST_BY_USER", "que tareas tiene Juan", "muestrame las tareas de ana@correo.com",
                "pendientes asignados a Maria", "tasks assigned to dev@correo.com",
                "show me tasks for a developer");
        add(seed, "TASK_LIST_BY_DEVELOPER", "tareas por desarrollador",
                "tasks assigned to each developer", "workload by developer",
                "lista tareas asignadas por usuario");
        add(seed, "TASK_CREATE", "agrega una tarea para terminar el login", "crea una tarea",
                "registrar tarea nueva", "crear pendiente", "alta de tarea");
        add(seed, "TASK_UPDATE_STATUS", "marca la tarea 5 como terminada", "pon la tarea en progreso",
                "cambia la tarea a done", "actualiza estado de tarea");
        add(seed, "TASK_DELETE", "elimina la tarea 5", "borra la tarea", "quita task");
        add(seed, "SPRINT_LIST", "que sprints estan activos", "lista los sprints", "muestrame sprints");
        add(seed, "BUG_LIST", "muestrame los bugs abiertos", "que bugs hay", "lista bugs");
        add(seed, "ISSUE_LIST", "muestrame los issues abiertos", "lista incidencias", "issues del sprint");
        add(seed, "KPI_SUMMARY", "dame los kpis", "como va el proyecto", "resumen de metricas");
        add(seed, "TIME_ESTIMATED_VS_REAL", "cuanto tiempo real llevamos contra el estimado",
                "compara horas reales y estimadas", "tiempo estimado vs tiempo real");
        add(seed, "HELP", "ayuda", "comandos disponibles", "que puedes hacer");
        this.examples = Collections.unmodifiableList(seed);
    }

    public List<IntentExample> findActiveExamples() {
        return examples;
    }

    private void add(List<IntentExample> target, String intentKey, String... phrases) {
        for (String phrase : phrases) {
            target.add(new IntentExample(intentKey, phrase));
        }
    }

    public static class IntentExample {
        private final String intentKey;
        private final String text;

        public IntentExample(String intentKey, String text) {
            this.intentKey = intentKey;
            this.text = text;
        }

        public String getIntentKey() {
            return intentKey;
        }

        public String getText() {
            return text;
        }
    }
}

package com.springboot.MyTodoList.task;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.springboot.MyTodoList.service.AuthUserService;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private AuthUserService authUserService;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @GetMapping("/sprint/{sprintId}")
    public List<Task> getTasksBySprint(@PathVariable Long sprintId) {
        return taskService.findBySprintId(sprintId);
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task, Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para crear tareas.", HttpStatus.FORBIDDEN);
        }
        try {
            Task saved = taskService.addTask(task);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Error creating task: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Task task, Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para editar tareas.", HttpStatus.FORBIDDEN);
        }
        try {
            Task updated = taskService.updateTask(id, task);
            if (updated != null) {
                return new ResponseEntity<>(updated, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println("Error updating task " + id + ": " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para borrar tareas.", HttpStatus.FORBIDDEN);
        }
        try {
            taskService.deleteTask(id);
            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/assignees")
    public ResponseEntity<?> assignTask(@RequestBody TaskAssignee assignee, Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para asignar tareas.", HttpStatus.FORBIDDEN);
        }
        try {
            TaskAssignee saved = taskService.assignTask(assignee);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}/assignees")
    public List<TaskAssignee> getAssignees(@PathVariable Long id) {
        return taskService.getAssigneesByTaskId(id);
    }

    // GET /tasks/assignees/all — todos los assignees (para analytics)
    @GetMapping("/assignees/all")
    public List<TaskAssignee> getAllAssignees() {
        return taskService.getAllAssignees();
    }

    // DELETE /tasks/assignees/{taskId}/{oracleId} — elimina un assignee específico
    @DeleteMapping("/assignees/{taskId}/{oracleId}")
    public ResponseEntity<?> removeAssignee(
            @PathVariable Long taskId,
            @PathVariable Long oracleId,
            Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para quitar asignaciones.", HttpStatus.FORBIDDEN);
        }
        try {
            taskService.removeAssignee(taskId, oracleId);
            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /tasks/assignees/{taskId}/{oracleId}/hours — actualiza horas reales y/o estimadas
    @PutMapping("/assignees/{taskId}/{oracleId}/hours")
    public ResponseEntity<TaskAssignee> updateHours(
            @PathVariable Long taskId,
            @PathVariable Long oracleId,
            @RequestBody java.util.Map<String, Double> body) {
        try {
            Double realTimeSpent = body.get("realTimeSpent");
            Double estimatedCompletionTime = body.get("estimatedCompletionTime");
            TaskAssignee updated = taskService.updateAssigneeHours(taskId, oracleId, realTimeSpent, estimatedCompletionTime);
            if (updated != null) {
                return new ResponseEntity<>(updated, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            System.err.println("Error updating hours: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeTask(
            @PathVariable Long id,
            @RequestBody TaskCompletionRequest body) {
        try {
            Task updated = taskService.completeTask(id, body.getOracleId(), body.getRealTimeSpent());
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            System.err.println("Error completing task " + id + ": " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

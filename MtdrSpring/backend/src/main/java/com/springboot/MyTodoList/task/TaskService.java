package com.springboot.MyTodoList.task;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskAssigneeRepository taskAssigneeRepository;

    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    public List<Task> findBySprintId(Long sprintId) {
        return taskRepository.findBySprintId(sprintId);
    }

    public ResponseEntity<Task> getTaskById(Long id) {
        Optional<Task> task = taskRepository.findById(id);
        if (task.isPresent()) {
            return new ResponseEntity<>(task.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public Task addTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task updated) {
        Optional<Task> existing = taskRepository.findById(id);
        if (existing.isPresent()) {
            Task task = existing.get();
            // Solo actualiza campos editables — createdBy y timestamps se preservan
            // de la entidad existente en BD, nunca se sobreescriben
            if (updated.getTaskName() != null && !updated.getTaskName().isBlank()) {
                task.setTaskName(updated.getTaskName());
            }
            if (updated.getStatus() != null) {
                task.setStatus(updated.getStatus());
            }
            task.setDescription(updated.getDescription());
            if (updated.getDueDate() != null) {
                task.setDueDate(updated.getDueDate());
            }
            if (updated.getCategory() != null) {
                task.setCategory(updated.getCategory());
            }
            if (updated.getStoryPoints() != null) {
                task.setStoryPoints(updated.getStoryPoints());
            }
            task.setSprintId(updated.getSprintId()); // null = quitar sprint, permitido
            return taskRepository.save(task);
        }
        return null;
    }

    public boolean deleteTask(Long id) {
        try {
            List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(id);
            if (!assignees.isEmpty()) {
                taskAssigneeRepository.deleteAll(assignees);
            }
            taskRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            System.err.println("Error deleting task " + id + ": " + e.getMessage());
            return false;
        }
    }

    public TaskAssignee assignTask(TaskAssignee assignee) {
        return taskAssigneeRepository.save(assignee);
    }

    public List<TaskAssignee> getAssigneesByTaskId(Long taskId) {
        return taskAssigneeRepository.findByTaskId(taskId);
    }

    public List<TaskAssignee> getAllAssignees() {
        return taskAssigneeRepository.findAll();
    }

    public void removeAssignee(Long taskId, Long oracleId) {
        TaskAssignee.TaskAssigneeId pk = new TaskAssignee.TaskAssigneeId(taskId, oracleId);
        taskAssigneeRepository.deleteById(pk);
    }

    public TaskAssignee updateAssigneeHours(Long taskId, Long oracleId, Double realTimeSpent, Double estimatedCompletionTime) {
        TaskAssignee.TaskAssigneeId pk = new TaskAssignee.TaskAssigneeId(taskId, oracleId);
        return taskAssigneeRepository.findById(pk).map(assignee -> {
            if (realTimeSpent != null) assignee.setRealTimeSpent(realTimeSpent);
            if (estimatedCompletionTime != null) assignee.setEstimatedCompletionTime(estimatedCompletionTime);
            return taskAssigneeRepository.save(assignee);
        }).orElse(null);
    }
}
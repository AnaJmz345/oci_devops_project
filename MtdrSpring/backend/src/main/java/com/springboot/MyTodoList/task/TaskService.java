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
            task.setTaskName(updated.getTaskName());
            task.setStatus(updated.getStatus());
            task.setDescription(updated.getDescription());
            task.setDueDate(updated.getDueDate());
            task.setCategory(updated.getCategory());
            task.setStoryPoints(updated.getStoryPoints());
            task.setSprintId(updated.getSprintId());
            return taskRepository.save(task);
        }
        return null;
    }

    public boolean deleteTask(Long id) {
        try {
            // Borrar assignees primero para no violar FK constraint
            List<TaskAssignee> assignees = taskAssigneeRepository.findByTaskId(id);
            if (!assignees.isEmpty()) {
                taskAssigneeRepository.deleteAll(assignees);
            }
            taskRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public TaskAssignee assignTask(TaskAssignee assignee) {
        return taskAssigneeRepository.save(assignee);
    }

    public List<TaskAssignee> getAssigneesByTaskId(Long taskId) {
        return taskAssigneeRepository.findByTaskId(taskId);
    }
}
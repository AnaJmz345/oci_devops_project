package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.repository.ToDoItemRepository;
import com.springboot.MyTodoList.task.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ToDoItemService {

    @Autowired
    private ToDoItemRepository toDoItemRepository;

    // Convierte Task (entidad JPA) a ToDoItem (modelo legacy usado por el bot)
    private ToDoItem toDto(Task t) {
        ToDoItem item = new ToDoItem();
        item.setID((int) (long) t.getTaskId());
        item.setDescription(t.getTaskName());
        item.setDone(t.getStatus());
        item.setName(t.getDescription());
        item.setStoryPoints(t.getStoryPoints());
        return item;
    }

    // Convierte ToDoItem legacy a Task para guardar en BD
    private Task toEntity(ToDoItem item) {
        Task t = new Task();
        item.setDone(item.getDone() != null ? item.getDone() : "TODO");
        t.setTaskName(item.getDescription());
        t.setStatus(item.getDone());
        t.setDescription(item.getName());
        t.setStoryPoints(item.getStoryPoints());
        t.setCreatedBy(1L); // valor por defecto para compatibilidad legacy
        return t;
    }

    public List<ToDoItem> findAll() {
        return toDoItemRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ResponseEntity<ToDoItem> getItemById(int id) {
        Optional<Task> data = toDoItemRepository.findById(id);
        if (data.isPresent()) {
            return new ResponseEntity<>(toDto(data.get()), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public ToDoItem getToDoItemById(int id) {
        Optional<Task> data = toDoItemRepository.findById(id);
        return data.map(this::toDto).orElse(null);
    }

    public ToDoItem addToDoItem(ToDoItem toDoItem) {
        Task saved = toDoItemRepository.save(toEntity(toDoItem));
        return toDto(saved);
    }

    public boolean deleteToDoItem(int id) {
        try {
            toDoItemRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public ToDoItem updateToDoItem(int id, ToDoItem td) {
        Optional<Task> data = toDoItemRepository.findById(id);
        if (data.isPresent()) {
            Task task = data.get();
            task.setTaskName(td.getDescription());
            task.setStatus(td.getDone());
            if (td.getName() != null) task.setDescription(td.getName());
            if (td.getStoryPoints() != null) task.setStoryPoints(td.getStoryPoints());
            return toDto(toDoItemRepository.save(task));
        }
        return null;
    }
}
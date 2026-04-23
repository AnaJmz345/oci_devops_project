package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.task.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;

// Alias de TaskRepository para compatibilidad con ToDoItemService y el bot de Telegram.
// Ambos apuntan a la misma entidad Task con el mismo tipo Long.
@Repository
@Transactional
@EnableTransactionManagement
public interface ToDoItemRepository extends JpaRepository<Task, Long> {
}

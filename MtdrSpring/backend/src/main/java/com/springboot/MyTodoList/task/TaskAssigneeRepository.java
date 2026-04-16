package com.springboot.MyTodoList.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import java.util.List;

@Repository
@Transactional
public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, TaskAssignee.TaskAssigneeId> {
    List<TaskAssignee> findByTaskId(Long taskId);
    List<TaskAssignee> findByOracleId(Long oracleId);
}
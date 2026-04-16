package com.springboot.MyTodoList.sprint;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import java.util.List;

@Repository
@Transactional
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByStatus(String status);
}

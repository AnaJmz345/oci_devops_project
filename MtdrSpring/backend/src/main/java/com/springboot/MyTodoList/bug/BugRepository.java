package com.springboot.MyTodoList.bug;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import java.util.List;

@Repository
@Transactional
public interface BugRepository extends JpaRepository<Bug, Long> {
    List<Bug> findByTaskId(Long taskId);
    List<Bug> findByReportedBy(Long reportedBy);
    List<Bug> findBySolvedByIsNotNull();
    List<Bug> findBySolvedByIsNull();
}
package com.springboot.MyTodoList.bug;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BugService {

    @Autowired
    private BugRepository bugRepository;

    public List<Bug> findAll() {
        return bugRepository.findAll();
    }

    public ResponseEntity<Bug> getBugById(Long id) {
        Optional<Bug> bug = bugRepository.findById(id);
        return bug.map(b -> new ResponseEntity<>(b, HttpStatus.OK))
                   .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    public List<Bug> findByTaskId(Long taskId) {
        return bugRepository.findByTaskId(taskId);
    }

    public List<Bug> findByReportedBy(Long reportedBy) {
        return bugRepository.findByReportedBy(reportedBy);
    }

    public Bug addBug(Bug bug) {
        return bugRepository.save(bug);
    }

    public Bug updateBug(Long id, Bug bugDetails) {
        Optional<Bug> existing = bugRepository.findById(id);
        if (existing.isPresent()) {
            Bug bug = existing.get();
            if (bugDetails.getDescription() != null) bug.setDescription(bugDetails.getDescription());
            if (bugDetails.getSolvedBy() != null) bug.setSolvedBy(bugDetails.getSolvedBy());
            return bugRepository.save(bug);
        }
        return null;
    }

    public void deleteBug(Long id) {
        bugRepository.deleteById(id);
    }
}
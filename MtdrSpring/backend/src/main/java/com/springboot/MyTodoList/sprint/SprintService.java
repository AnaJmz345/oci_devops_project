package com.springboot.MyTodoList.sprint;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class SprintService {

    @Autowired
    private SprintRepository sprintRepository;

    public List<Sprint> findAll() {
        return sprintRepository.findAll();
    }

    public List<Sprint> findByStatus(String status) {
        return sprintRepository.findByStatus(status);
    }

    public ResponseEntity<Sprint> getSprintById(Long id) {
        Optional<Sprint> sprint = sprintRepository.findById(id);
        if (sprint.isPresent()) {
            return new ResponseEntity<>(sprint.get(), HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    public Sprint createSprint(Sprint sprint) {
        return sprintRepository.save(sprint);
    }

    public Sprint updateSprint(Long id, Sprint updated) {
        Optional<Sprint> existing = sprintRepository.findById(id);
        if (existing.isPresent()) {
            Sprint sprint = existing.get();
            sprint.setSprintName(updated.getSprintName());
            sprint.setStartDate(updated.getStartDate());
            sprint.setEndDate(updated.getEndDate());
            sprint.setStatus(updated.getStatus());
            sprint.setGoal(updated.getGoal());
            if (sprint.getStartDate() != null && sprint.getEndDate() != null) {
                sprint.setSprintDuration(
                    (int)(sprint.getEndDate().toEpochDay() - sprint.getStartDate().toEpochDay())
                );
            }
            return sprintRepository.save(sprint);
        }
        return null;
    }

    public boolean deleteSprint(Long id) {
        try {
            sprintRepository.deleteById(id);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

package com.springboot.MyTodoList.sprint;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.springboot.MyTodoList.service.AuthUserService;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/sprints")
public class SprintController {

    @Autowired
    private SprintService sprintService;

    @Autowired
    private AuthUserService authUserService;

    // GET /sprints
    @GetMapping
    public List<Sprint> getAllSprints() {
        return sprintService.findAll();
    }

    // GET /sprints/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Sprint> getSprintById(@PathVariable Long id) {
        return sprintService.getSprintById(id);
    }

    // GET /sprints/status/{status}
    @GetMapping("/status/{status}")
    public List<Sprint> getByStatus(@PathVariable String status) {
        return sprintService.findByStatus(status);
    }

    // POST /sprints
    @PostMapping
    public ResponseEntity<?> createSprint(@RequestBody Sprint sprint, Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para crear sprints.", HttpStatus.FORBIDDEN);
        }
        try {
            Sprint saved = sprintService.createSprint(sprint);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // PUT /sprints/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSprint(@PathVariable Long id, @RequestBody Sprint sprint, Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para editar sprints.", HttpStatus.FORBIDDEN);
        }
        Sprint updated = sprintService.updateSprint(id, sprint);
        if (updated != null) {
            return new ResponseEntity<>(updated, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    // DELETE /sprints/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSprint(@PathVariable Long id, Authentication authentication) {
        if (!authUserService.isManager(authentication)) {
            return new ResponseEntity<>("No tienes permisos para borrar sprints.", HttpStatus.FORBIDDEN);
        }
        boolean deleted = sprintService.deleteSprint(id);
        return new ResponseEntity<>(deleted, deleted ? HttpStatus.OK : HttpStatus.NOT_FOUND);
    }
}

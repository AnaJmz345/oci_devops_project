package com.springboot.MyTodoList.bug;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bugs")
public class BugController {

    @Autowired
    private BugService bugService;

    @GetMapping
    public List<Bug> getAllBugs() {
        return bugService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bug> getBugById(@PathVariable Long id) {
        return bugService.getBugById(id);
    }

    @GetMapping("/task/{taskId}")
    public List<Bug> getBugsByTaskId(@PathVariable Long taskId) {
        return bugService.findByTaskId(taskId);
    }

    @PostMapping
    public ResponseEntity<Bug> createBug(@RequestBody Bug bug) {
        try {
            Bug saved = bugService.addBug(bug);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Error creating bug: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Mark a bug as solved
    @PutMapping("/{id}/solve")
    public ResponseEntity<Bug> solveBug(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        try {
            Bug bugDetails = new Bug();
            bugDetails.setSolvedBy(body.get("solvedBy"));
            Bug updated = bugService.updateBug(id, bugDetails);
            if (updated != null) {
                return new ResponseEntity<>(updated, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bug> updateBug(@PathVariable Long id, @RequestBody Bug bug) {
        try {
            Bug updated = bugService.updateBug(id, bug);
            if (updated != null) {
                return new ResponseEntity<>(updated, HttpStatus.OK);
            }
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Boolean> deleteBug(@PathVariable Long id) {
        try {
            bugService.deleteBug(id);
            return new ResponseEntity<>(true, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(false, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
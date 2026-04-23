package com.springboot.MyTodoList.sprint;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "SPRINTS", schema = "VANTAGE")
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "sprint_seq_gen")
    @SequenceGenerator(
        name = "sprint_seq_gen",
        sequenceName = "VANTAGE.SPRINT_SEQ",
        allocationSize = 1
    )
    @Column(name = "SPRINT_ID")
    private Long sprintId;

    @Column(name = "SPRINT_NAME", nullable = false)
    private String sprintName;

    @Column(name = "START_DATE", nullable = false)
    private LocalDate startDate;

    @Column(name = "END_DATE", nullable = false)
    private LocalDate endDate;

    @Column(name = "SPRINT_DURATION", nullable = false)
    private Integer sprintDuration;

    @Column(name = "STATUS", nullable = false)
    private String status = "PLANNED";

    @Column(name = "GOAL")
    private String goal;

    @PrePersist
    protected void calculateDuration() {
        if (startDate != null && endDate != null) {
            sprintDuration = (int) (endDate.toEpochDay() - startDate.toEpochDay());
        }
    }

    public Sprint() {}

    public Long getSprintId() { return sprintId; }
    public void setSprintId(Long sprintId) { this.sprintId = sprintId; }

    public String getSprintName() { return sprintName; }
    public void setSprintName(String sprintName) { this.sprintName = sprintName; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getSprintDuration() { return sprintDuration; }
    public void setSprintDuration(Integer sprintDuration) { this.sprintDuration = sprintDuration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }
}

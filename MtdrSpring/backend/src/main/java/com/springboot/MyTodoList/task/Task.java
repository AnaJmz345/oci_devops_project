package com.springboot.MyTodoList.task;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Entity
@Table(name = "TASK", schema = "VANTAGE")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "task_seq_gen")
    @SequenceGenerator(
        name = "task_seq_gen",
        sequenceName = "VANTAGE.TASK_SEQ",
        allocationSize = 1
    )
    @Column(name = "TASK_ID")
    private Long taskId;

    @Column(name = "TASK_NAME", nullable = false)
    private String taskName;

    @Column(name = "STATUS", nullable = false)
    private String status = "TODO";

    @Column(name = "DESCRIPTION")
    private String description;

    @Column(name = "DUE_DATE")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;

    @Column(name = "CATEGORY", nullable = false)
    private String category = "FEATURE";

    @Column(name = "STORY_POINTS")
    private Integer storyPoints = 1;

    @Column(name = "SPRINT_ID")
    private Long sprintId;

    // insertable=false, updatable=false — Oracle handles these with DEFAULT CURRENT_TIMESTAMP
    @Column(name = "CREATED_AT", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "UPDATED_AT", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "CREATED_BY", nullable = false)
    private Long createdBy;

    public Task() {}

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getStoryPoints() { return storyPoints; }
    public void setStoryPoints(Integer storyPoints) { this.storyPoints = storyPoints; }

    public Long getSprintId() { return sprintId; }
    public void setSprintId(Long sprintId) { this.sprintId = sprintId; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
}
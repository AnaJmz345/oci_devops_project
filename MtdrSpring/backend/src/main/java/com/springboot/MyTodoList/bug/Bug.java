package com.springboot.MyTodoList.bug;

import jakarta.persistence.*;

@Entity
@Table(name = "BUGS", schema = "VANTAGE")
public class Bug {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "bug_seq_gen")
    @SequenceGenerator(
        name = "bug_seq_gen",
        sequenceName = "VANTAGE.BUG_SEQ",
        allocationSize = 1
    )
    @Column(name = "BUG_ID")
    private Long bugId;

    @Column(name = "TASK_ID", nullable = false)
    private Long taskId;

    @Column(name = "REPORTED_BY")
    private Long reportedBy;

    @Column(name = "SOLVED_BY")
    private Long solvedBy;

    @Column(name = "DESCRIPTION", nullable = false, length = 1000)
    private String description;

    public Bug() {}

    public Long getBugId() { return bugId; }
    public void setBugId(Long bugId) { this.bugId = bugId; }

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public Long getReportedBy() { return reportedBy; }
    public void setReportedBy(Long reportedBy) { this.reportedBy = reportedBy; }

    public Long getSolvedBy() { return solvedBy; }
    public void setSolvedBy(Long solvedBy) { this.solvedBy = solvedBy; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
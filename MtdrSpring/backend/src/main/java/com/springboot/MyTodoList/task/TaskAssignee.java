package com.springboot.MyTodoList.task;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "TASK_ASSIGNEES", schema = "VANTAGE")
@IdClass(TaskAssignee.TaskAssigneeId.class)
public class TaskAssignee {

    @Id
    @Column(name = "TASK_ID")
    private Long taskId;

    @Id
    @Column(name = "ORACLE_ID")
    private Long oracleId;

    @Column(name = "REAL_TIME_SPENT")
    private Double realTimeSpent = 0.0;

    @Column(name = "ESTIMATED_COMPLETION_TIME")
    private Double estimatedCompletionTime;

    @Column(name = "ADDITIONAL_COMMENTS")
    private String additionalComments;

    public TaskAssignee() {}

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public Long getOracleId() { return oracleId; }
    public void setOracleId(Long oracleId) { this.oracleId = oracleId; }

    public Double getRealTimeSpent() { return realTimeSpent; }
    public void setRealTimeSpent(Double realTimeSpent) { this.realTimeSpent = realTimeSpent; }

    public Double getEstimatedCompletionTime() { return estimatedCompletionTime; }
    public void setEstimatedCompletionTime(Double estimatedCompletionTime) {
        this.estimatedCompletionTime = estimatedCompletionTime;
    }

    public String getAdditionalComments() { return additionalComments; }
    public void setAdditionalComments(String additionalComments) {
        this.additionalComments = additionalComments;
    }

    // Clave compuesta (task_id + oracle_id)
    public static class TaskAssigneeId implements Serializable {
        private Long taskId;
        private Long oracleId;

        public TaskAssigneeId() {}
        public TaskAssigneeId(Long taskId, Long oracleId) {
            this.taskId = taskId;
            this.oracleId = oracleId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof TaskAssigneeId)) return false;
            TaskAssigneeId that = (TaskAssigneeId) o;
            return Objects.equals(taskId, that.taskId) && Objects.equals(oracleId, that.oracleId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(taskId, oracleId);
        }
    }
}
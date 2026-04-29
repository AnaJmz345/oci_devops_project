package com.springboot.MyTodoList.task;

public class TaskCompletionRequest {

    private Long oracleId;
    private Double realTimeSpent;

    public Long getOracleId() {
        return oracleId;
    }

    public void setOracleId(Long oracleId) {
        this.oracleId = oracleId;
    }

    public Double getRealTimeSpent() {
        return realTimeSpent;
    }

    public void setRealTimeSpent(Double realTimeSpent) {
        this.realTimeSpent = realTimeSpent;
    }
}
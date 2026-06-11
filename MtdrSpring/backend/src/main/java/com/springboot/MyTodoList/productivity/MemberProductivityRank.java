package com.springboot.MyTodoList.productivity;

public class MemberProductivityRank {
    private final int rank;
    private final Long oracleId;
    private final String name;
    private final int productivityScore;
    private final int completedTasks;
    private final int assignedTasks;
    private final int completionPct;
    private final int onEstimatePct;
    private final double varianceHours;
    private final String signal;
    private final String explanation;

    public MemberProductivityRank(int rank, Long oracleId, String name, int productivityScore,
            int completedTasks, int assignedTasks, int completionPct, int onEstimatePct,
            double varianceHours, String signal, String explanation) {
        this.rank = rank;
        this.oracleId = oracleId;
        this.name = name;
        this.productivityScore = productivityScore;
        this.completedTasks = completedTasks;
        this.assignedTasks = assignedTasks;
        this.completionPct = completionPct;
        this.onEstimatePct = onEstimatePct;
        this.varianceHours = varianceHours;
        this.signal = signal;
        this.explanation = explanation;
    }

    public int getRank() { return rank; }
    public Long getOracleId() { return oracleId; }
    public String getName() { return name; }
    public int getProductivityScore() { return productivityScore; }
    public int getCompletedTasks() { return completedTasks; }
    public int getAssignedTasks() { return assignedTasks; }
    public int getCompletionPct() { return completionPct; }
    public int getOnEstimatePct() { return onEstimatePct; }
    public double getVarianceHours() { return varianceHours; }
    public String getSignal() { return signal; }
    public String getExplanation() { return explanation; }
}

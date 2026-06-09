package com.springboot.MyTodoList.productivity;

public class MemberProductivitySummary {
    private final Long oracleId;
    private final String name;
    private final int assignedTasks;
    private final int doneTasks;
    private final int completionPct;
    private final double estimatedHours;
    private final double actualHours;
    private final double varianceHours;
    private final int onEstimatePct;
    private final int bugsReported;
    private final int bugsSolved;
    private final int workloadSharePct;
    private final String summary;

    public MemberProductivitySummary(Long oracleId, String name, int assignedTasks, int doneTasks,
            int completionPct, double estimatedHours, double actualHours, double varianceHours,
            int onEstimatePct, int bugsReported, int bugsSolved, int workloadSharePct, String summary) {
        this.oracleId = oracleId;
        this.name = name;
        this.assignedTasks = assignedTasks;
        this.doneTasks = doneTasks;
        this.completionPct = completionPct;
        this.estimatedHours = estimatedHours;
        this.actualHours = actualHours;
        this.varianceHours = varianceHours;
        this.onEstimatePct = onEstimatePct;
        this.bugsReported = bugsReported;
        this.bugsSolved = bugsSolved;
        this.workloadSharePct = workloadSharePct;
        this.summary = summary;
    }

    public Long getOracleId() { return oracleId; }
    public String getName() { return name; }
    public int getAssignedTasks() { return assignedTasks; }
    public int getDoneTasks() { return doneTasks; }
    public int getCompletionPct() { return completionPct; }
    public double getEstimatedHours() { return estimatedHours; }
    public double getActualHours() { return actualHours; }
    public double getVarianceHours() { return varianceHours; }
    public int getOnEstimatePct() { return onEstimatePct; }
    public int getBugsReported() { return bugsReported; }
    public int getBugsSolved() { return bugsSolved; }
    public int getWorkloadSharePct() { return workloadSharePct; }
    public String getSummary() { return summary; }
}

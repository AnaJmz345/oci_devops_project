package com.springboot.MyTodoList.productivity;

public class TeamProductivitySummary {
    private final String scopeLabel;
    private final int totalTasks;
    private final int doneTasks;
    private final int inProgressTasks;
    private final int blockedTasks;
    private final int progressPct;
    private final double totalEstimatedHours;
    private final double totalActualHours;
    private final double estimateDeltaHours;
    private final int onEstimatePct;
    private final int bugsCreated;
    private final int bugsOpen;
    private final int bugsResolved;
    private final int bugResolvePct;
    private final int teamProductivityScore;

    public TeamProductivitySummary(String scopeLabel, int totalTasks, int doneTasks, int inProgressTasks,
            int blockedTasks, int progressPct, double totalEstimatedHours, double totalActualHours,
            double estimateDeltaHours, int onEstimatePct, int bugsCreated, int bugsOpen, int bugsResolved,
            int bugResolvePct, int teamProductivityScore) {
        this.scopeLabel = scopeLabel;
        this.totalTasks = totalTasks;
        this.doneTasks = doneTasks;
        this.inProgressTasks = inProgressTasks;
        this.blockedTasks = blockedTasks;
        this.progressPct = progressPct;
        this.totalEstimatedHours = totalEstimatedHours;
        this.totalActualHours = totalActualHours;
        this.estimateDeltaHours = estimateDeltaHours;
        this.onEstimatePct = onEstimatePct;
        this.bugsCreated = bugsCreated;
        this.bugsOpen = bugsOpen;
        this.bugsResolved = bugsResolved;
        this.bugResolvePct = bugResolvePct;
        this.teamProductivityScore = teamProductivityScore;
    }

    public String getScopeLabel() { return scopeLabel; }
    public int getTotalTasks() { return totalTasks; }
    public int getDoneTasks() { return doneTasks; }
    public int getInProgressTasks() { return inProgressTasks; }
    public int getBlockedTasks() { return blockedTasks; }
    public int getProgressPct() { return progressPct; }
    public double getTotalEstimatedHours() { return totalEstimatedHours; }
    public double getTotalActualHours() { return totalActualHours; }
    public double getEstimateDeltaHours() { return estimateDeltaHours; }
    public int getOnEstimatePct() { return onEstimatePct; }
    public int getBugsCreated() { return bugsCreated; }
    public int getBugsOpen() { return bugsOpen; }
    public int getBugsResolved() { return bugsResolved; }
    public int getBugResolvePct() { return bugResolvePct; }
    public int getTeamProductivityScore() { return teamProductivityScore; }
}

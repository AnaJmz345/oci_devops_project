package com.springboot.MyTodoList.productivity;

import com.springboot.MyTodoList.bug.Bug;
import com.springboot.MyTodoList.bug.BugService;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.UserService;
import com.springboot.MyTodoList.sprint.Sprint;
import com.springboot.MyTodoList.sprint.SprintService;
import com.springboot.MyTodoList.task.Task;
import com.springboot.MyTodoList.task.TaskAssignee;
import com.springboot.MyTodoList.task.TaskService;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ProductivityReportService {
    private final TaskService taskService;
    private final UserService userService;
    private final SprintService sprintService;
    private final BugService bugService;
    private final ProductivityPatternMatcher patternMatcher;
    private final double hourlyRateUsd;

    public ProductivityReportService(TaskService taskService, UserService userService, SprintService sprintService,
            BugService bugService, ProductivityPatternMatcher patternMatcher,
            @Value("${productivity.hourly-rate-usd:35}") double hourlyRateUsd) {
        this.taskService = taskService;
        this.userService = userService;
        this.sprintService = sprintService;
        this.bugService = bugService;
        this.patternMatcher = patternMatcher;
        this.hourlyRateUsd = hourlyRateUsd;
    }

    public ProductivityReport buildReport(String sprintId) {
        List<Task> selectedTasks = selectedTasks(sprintId);
        Set<Long> selectedTaskIds = selectedTasks.stream().map(Task::getTaskId).collect(Collectors.toSet());
        List<TaskAssignee> assignees = taskService.getAllAssignees().stream()
                .filter(a -> selectedTaskIds.contains(a.getTaskId()))
                .collect(Collectors.toList());
        List<Bug> bugs = bugService.findAll().stream()
                .filter(b -> selectedTaskIds.contains(b.getTaskId()))
                .collect(Collectors.toList());
        List<User> developers = userService.findByRole("DEVELOPER");

        TeamProductivitySummary teamSummary = buildTeamSummary(sprintId, selectedTasks, assignees, bugs);
        List<MemberProductivitySummary> members = buildMembers(developers, selectedTasks, assignees, bugs);
        List<MemberProductivityRank> memberRanking = buildMemberRanking(members);
        List<ProductivityInsight> patterns = buildPatternInsights(teamSummary, members);
        List<ProductivityInsight> recommendations = patterns.stream()
                .filter(p -> !"positive".equals(p.getSeverity()))
                .limit(4)
                .collect(Collectors.toList());

        SavingsEstimate savings = buildSavings(teamSummary, selectedTasks, bugs);

        return new ProductivityReport(
                OffsetDateTime.now(),
                "LOCAL_VECTOR_EMBEDDINGS_384D",
                teamSummary,
                members,
                memberRanking,
                patterns,
                recommendations,
                savings,
                kpiExplanations());
    }

    private List<Task> selectedTasks(String sprintId) {
        List<Task> all = taskService.findAll();
        if (sprintId == null || sprintId.isBlank() || "all".equalsIgnoreCase(sprintId)) {
            return all.stream().filter(t -> t.getSprintId() != null).collect(Collectors.toList());
        }
        Long id = Long.valueOf(sprintId);
        return all.stream().filter(t -> id.equals(t.getSprintId())).collect(Collectors.toList());
    }

    private TeamProductivitySummary buildTeamSummary(String sprintId, List<Task> tasks,
            List<TaskAssignee> assignees, List<Bug> bugs) {
        int totalTasks = tasks.size();
        int doneTasks = (int) tasks.stream().filter(t -> "DONE".equalsIgnoreCase(t.getStatus())).count();
        int inProgress = (int) tasks.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        int blocked = (int) tasks.stream().filter(t -> "BLOCKED".equalsIgnoreCase(t.getStatus())).count();
        int progressPct = pct(doneTasks, totalTasks);

        Set<Long> doneTaskIds = tasks.stream()
                .filter(t -> "DONE".equalsIgnoreCase(t.getStatus()))
                .map(Task::getTaskId)
                .collect(Collectors.toSet());
        List<TaskAssignee> completedAssignees = assignees.stream()
                .filter(a -> doneTaskIds.contains(a.getTaskId()))
                .filter(a -> value(a.getEstimatedCompletionTime()) > 0.0)
                .collect(Collectors.toList());

        double estimated = round1(completedAssignees.stream()
                .mapToDouble(a -> value(a.getEstimatedCompletionTime())).sum());
        double actual = round1(completedAssignees.stream()
                .mapToDouble(a -> value(a.getRealTimeSpent())).sum());
        int onEstimatePct = pct((int) completedAssignees.stream()
                .filter(a -> value(a.getRealTimeSpent()) <= value(a.getEstimatedCompletionTime())).count(),
                completedAssignees.size());

        int bugsCreated = bugs.size();
        int bugsResolved = (int) bugs.stream().filter(b -> b.getSolvedBy() != null).count();
        int bugsOpen = bugsCreated - bugsResolved;
        int bugResolvePct = pct(bugsResolved, bugsCreated);
        int teamScore = clamp((int) Math.round((progressPct * 0.45) + (onEstimatePct * 0.25)
                + (bugResolvePct * 0.20) - (blocked * 5) - (bugsOpen * 3)), 0, 100);

        return new TeamProductivitySummary(scopeLabel(sprintId), totalTasks, doneTasks, inProgress, blocked,
                progressPct, estimated, actual, round1(actual - estimated), onEstimatePct, bugsCreated,
                bugsOpen, bugsResolved, bugResolvePct, teamScore);
    }

    private List<MemberProductivitySummary> buildMembers(List<User> developers, List<Task> tasks,
            List<TaskAssignee> assignees, List<Bug> bugs) {
        int totalAssignments = Math.max(1, assignees.size());
        Map<Long, Task> tasksById = tasks.stream().collect(Collectors.toMap(Task::getTaskId, t -> t, (a, b) -> a));
        List<MemberProductivitySummary> summaries = new ArrayList<>();

        for (User user : developers) {
            List<TaskAssignee> userAssignees = assignees.stream()
                    .filter(a -> user.getOracleId().equals(a.getOracleId()))
                    .collect(Collectors.toList());
            int assigned = userAssignees.size();
            int done = (int) userAssignees.stream()
                    .map(a -> tasksById.get(a.getTaskId()))
                    .filter(t -> t != null && "DONE".equalsIgnoreCase(t.getStatus()))
                    .count();
            double estimated = round1(userAssignees.stream().mapToDouble(a -> value(a.getEstimatedCompletionTime())).sum());
            double actual = round1(userAssignees.stream().mapToDouble(a -> value(a.getRealTimeSpent())).sum());
            List<TaskAssignee> withEstimate = userAssignees.stream()
                    .filter(a -> value(a.getEstimatedCompletionTime()) > 0.0)
                    .collect(Collectors.toList());
            int onEstimatePct = pct((int) withEstimate.stream()
                    .filter(a -> value(a.getRealTimeSpent()) <= value(a.getEstimatedCompletionTime())).count(),
                    withEstimate.size());
            int bugsReported = (int) bugs.stream().filter(b -> user.getOracleId().equals(b.getReportedBy())).count();
            int bugsSolved = (int) bugs.stream().filter(b -> user.getOracleId().equals(b.getSolvedBy())).count();
            int workloadSharePct = pct(assigned, totalAssignments);

            summaries.add(new MemberProductivitySummary(
                    user.getOracleId(),
                    user.getName(),
                    assigned,
                    done,
                    pct(done, assigned),
                    estimated,
                    actual,
                    round1(actual - estimated),
                    onEstimatePct,
                    bugsReported,
                    bugsSolved,
                    workloadSharePct,
                    memberSummary(assigned, done, actual - estimated, workloadSharePct)));
        }

        return summaries.stream()
                .filter(m -> m.getAssignedTasks() > 0 || m.getBugsReported() > 0 || m.getBugsSolved() > 0)
                .sorted(Comparator.comparing(MemberProductivitySummary::getAssignedTasks).reversed())
                .collect(Collectors.toList());
    }

    private List<ProductivityInsight> buildPatternInsights(TeamProductivitySummary team,
            List<MemberProductivitySummary> members) {
        List<String> observations = new ArrayList<>();
        if (team.getProgressPct() < 45 && team.getTotalTasks() > 0) {
            observations.add("low sprint progress with few completed tasks");
        } else if (team.getProgressPct() >= 75 && team.getBugsOpen() == 0) {
            observations.add("strong team delivery with high progress and few bugs");
        }
        if (team.getEstimateDeltaHours() > Math.max(4.0, team.getTotalEstimatedHours() * 0.15)) {
            observations.add("actual hours over estimated hours by " + team.getEstimateDeltaHours());
        } else if (team.getTotalEstimatedHours() > 0 && team.getEstimateDeltaHours() <= 0) {
            observations.add("actual hours under estimated hours and tasks within estimate");
        }
        if (team.getBugsOpen() > 0 || (team.getBugsCreated() > 0 && team.getBugResolvePct() < 60)) {
            observations.add("many open bugs and quality risk in finished work");
        }
        members.stream()
                .filter(m -> m.getWorkloadSharePct() >= 45 && members.size() > 1)
                .findFirst()
                .ifPresent(m -> observations.add("one member has too many assigned tasks workload imbalance " + m.getName()));

        List<ProductivityInsight> insights = new ArrayList<>();
        Set<String> seenPatterns = new HashSet<>();
        for (String observation : observations) {
            ProductivityPatternMatcher.MatchedPattern match = patternMatcher.match(observation);
            if (match == null || !seenPatterns.add(match.getPattern().getKey())) {
                continue;
            }
            insights.add(new ProductivityInsight(
                    match.getPattern().getKey(),
                    match.getPattern().getSeverity(),
                    match.getPattern().getTitle(),
                    match.getPattern().getDescription() + " Observation: " + observation + ".",
                    match.getPattern().getRecommendation(),
                    round2(match.getConfidence()),
                    match.getMatchedExample()));
        }

        if (insights.isEmpty()) {
            ProductivityPatternMatcher.MatchedPattern match = patternMatcher.match("strong team delivery");
            insights.add(new ProductivityInsight("STABLE_DELIVERY", "positive", "Stable operation",
                    "No critical patterns were detected with the current data.",
                    "Continue logging estimates, actual hours, and bugs to improve analysis accuracy.",
                    match == null ? 0.0 : round2(match.getConfidence()),
                    match == null ? "default" : match.getMatchedExample()));
        }
        return insights;
    }

    private List<MemberProductivityRank> buildMemberRanking(List<MemberProductivitySummary> members) {
        List<MemberProductivityRank> scored = members.stream()
                .map(member -> {
                    String observation = memberObservation(member);
                    ProductivityPatternMatcher.MatchedPattern match = patternMatcher.match(observation);
                    int score = memberProductivityScore(member, match);
                    String signal = match == null ? "Productivity signal" : match.getPattern().getTitle();
                    return new MemberProductivityRank(
                            0,
                            member.getOracleId(),
                            member.getName(),
                            score,
                            member.getDoneTasks(),
                            member.getAssignedTasks(),
                            member.getCompletionPct(),
                            member.getOnEstimatePct(),
                            member.getVarianceHours(),
                            signal,
                            memberRankingExplanation(member, signal));
                })
                .sorted(Comparator.comparing(MemberProductivityRank::getProductivityScore).reversed()
                        .thenComparing(MemberProductivityRank::getCompletedTasks, Comparator.reverseOrder())
                        .thenComparing(MemberProductivityRank::getVarianceHours))
                .collect(Collectors.toList());

        List<MemberProductivityRank> ranked = new ArrayList<>();
        for (int i = 0; i < scored.size(); i++) {
            MemberProductivityRank item = scored.get(i);
            ranked.add(new MemberProductivityRank(
                    i + 1,
                    item.getOracleId(),
                    item.getName(),
                    item.getProductivityScore(),
                    item.getCompletedTasks(),
                    item.getAssignedTasks(),
                    item.getCompletionPct(),
                    item.getOnEstimatePct(),
                    item.getVarianceHours(),
                    item.getSignal(),
                    item.getExplanation()));
        }
        return ranked;
    }

    private int memberProductivityScore(MemberProductivitySummary member,
            ProductivityPatternMatcher.MatchedPattern match) {
        int deliveryScore = pct(member.getDoneTasks(), Math.max(1, member.getAssignedTasks()));
        int throughputScore = Math.min(100, member.getDoneTasks() * 20);
        int estimateScore = member.getOnEstimatePct();
        int qualityScore = Math.min(100, member.getBugsSolved() * 20);
        int variancePenalty = member.getVarianceHours() > 0 ? Math.min(18, (int) Math.round(member.getVarianceHours() * 2)) : 0;

        int vectorSignalBonus = 0;
        if (match != null && "positive".equals(match.getPattern().getSeverity())) {
            vectorSignalBonus = 5;
        } else if (match != null && "warning".equals(match.getPattern().getSeverity())) {
            vectorSignalBonus = -5;
        } else if (match != null && "critical".equals(match.getPattern().getSeverity())) {
            vectorSignalBonus = -10;
        }

        int score = (int) Math.round(
                deliveryScore * 0.38
                        + throughputScore * 0.24
                        + estimateScore * 0.24
                        + qualityScore * 0.10
                        - variancePenalty
                        + vectorSignalBonus);
        return clamp(score, 0, 100);
    }

    private String memberObservation(MemberProductivitySummary member) {
        return "member completed " + member.getDoneTasks()
                + " of " + member.getAssignedTasks()
                + " assigned tasks with " + member.getCompletionPct()
                + " percent completion, " + member.getOnEstimatePct()
                + " percent within estimate, " + member.getVarianceHours()
                + " hours variance, and " + member.getBugsSolved()
                + " bugs solved";
    }

    private String memberRankingExplanation(MemberProductivitySummary member, String signal) {
        return signal + ": " + member.getDoneTasks() + " of " + member.getAssignedTasks()
                + " tasks completed, " + member.getOnEstimatePct()
                + "% within estimate, and " + member.getVarianceHours()
                + "h estimate delta.";
    }

    private SavingsEstimate buildSavings(TeamProductivitySummary team, List<Task> tasks, List<Bug> bugs) {
        double reportingHoursSaved = tasks.size() * 0.25;
        double coordinationHoursSaved = team.getDoneTasks() * 0.35;
        double bugTrackingHoursSaved = bugs.size() * 0.20;
        double estimateSavings = Math.max(0.0, -team.getEstimateDeltaHours());
        double hoursSaved = round1(reportingHoursSaved + coordinationHoursSaved + bugTrackingHoursSaved + estimateSavings);
        double moneySaved = round1(hoursSaved * hourlyRateUsd);
        String explanation = "Local estimate: 15 minutes saved per tracked task, 21 minutes per completed task, "
                + "12 minutes per tracked bug, plus time gained when the team finishes under estimate.";
        return new SavingsEstimate(hoursSaved, moneySaved, hourlyRateUsd, explanation);
    }

    private List<KpiExplanation> kpiExplanations() {
        return List.of(
                new KpiExplanation("progressPct", "Delivery progress", "Percentage of completed tasks in the selected scope.",
                        "DONE tasks / total tasks * 100"),
                new KpiExplanation("estimateDeltaHours", "Estimated vs actual", "Difference between actual hours and estimated hours.",
                        "actual hours - estimated hours"),
                new KpiExplanation("onEstimatePct", "Estimate hit rate", "Completed assignments delivered within or under estimate.",
                        "assignments within estimate / assignments with estimates * 100"),
                new KpiExplanation("bugResolvePct", "Bug resolution", "Percentage of closed bugs out of all reported bugs.",
                        "resolved bugs / created bugs * 100"),
                new KpiExplanation("teamProductivityScore", "Productivity score", "Composite indicator for quick manager review.",
                        "45% progress + 25% estimate hit rate + 20% bug resolution - blocker/open bug penalty"));
    }

    private String scopeLabel(String sprintId) {
        if (sprintId == null || sprintId.isBlank() || "all".equalsIgnoreCase(sprintId)) {
            return "All sprints";
        }
        Optional<Sprint> sprint = sprintService.getSprintById(Long.valueOf(sprintId)).getStatusCode().is2xxSuccessful()
                ? Optional.ofNullable(sprintService.getSprintById(Long.valueOf(sprintId)).getBody())
                : Optional.empty();
        return sprint.map(Sprint::getSprintName).orElse("Sprint " + sprintId);
    }

    private String memberSummary(int assigned, int done, double variance, int workloadSharePct) {
        if (assigned == 0) {
            return "No assigned tasks in the selected scope.";
        }
        if (workloadSharePct >= 45) {
            return "Carries a high share of the team workload.";
        }
        if (variance > 2.0) {
            return "Requires review of estimates or recurring blockers.";
        }
        if (done == assigned) {
            return "Completed all assigned tasks in this scope.";
        }
        return "Normal progress with follow-up opportunities.";
    }

    private double value(Double value) {
        return value == null ? 0.0 : value;
    }

    private int pct(int part, int total) {
        return total > 0 ? (int) Math.round((part * 100.0) / total) : 0;
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}

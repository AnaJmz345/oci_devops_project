package com.springboot.MyTodoList.productivity;

import java.time.OffsetDateTime;
import java.util.List;

public class ProductivityReport {
    private final OffsetDateTime generatedAt;
    private final String embeddingMode;
    private final TeamProductivitySummary teamSummary;
    private final List<MemberProductivitySummary> members;
    private final List<ProductivityInsight> patterns;
    private final List<ProductivityInsight> recommendations;
    private final SavingsEstimate savingsEstimate;
    private final List<KpiExplanation> kpiExplanations;

    public ProductivityReport(OffsetDateTime generatedAt, String embeddingMode,
            TeamProductivitySummary teamSummary, List<MemberProductivitySummary> members,
            List<ProductivityInsight> patterns, List<ProductivityInsight> recommendations,
            SavingsEstimate savingsEstimate, List<KpiExplanation> kpiExplanations) {
        this.generatedAt = generatedAt;
        this.embeddingMode = embeddingMode;
        this.teamSummary = teamSummary;
        this.members = members;
        this.patterns = patterns;
        this.recommendations = recommendations;
        this.savingsEstimate = savingsEstimate;
        this.kpiExplanations = kpiExplanations;
    }

    public OffsetDateTime getGeneratedAt() { return generatedAt; }
    public String getEmbeddingMode() { return embeddingMode; }
    public TeamProductivitySummary getTeamSummary() { return teamSummary; }
    public List<MemberProductivitySummary> getMembers() { return members; }
    public List<ProductivityInsight> getPatterns() { return patterns; }
    public List<ProductivityInsight> getRecommendations() { return recommendations; }
    public SavingsEstimate getSavingsEstimate() { return savingsEstimate; }
    public List<KpiExplanation> getKpiExplanations() { return kpiExplanations; }
}

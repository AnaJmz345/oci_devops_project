package com.springboot.MyTodoList.productivity;

public class ProductivityInsight {
    private final String type;
    private final String severity;
    private final String title;
    private final String description;
    private final String recommendation;
    private final double confidence;
    private final String matchedPattern;

    public ProductivityInsight(String type, String severity, String title, String description,
            String recommendation, double confidence, String matchedPattern) {
        this.type = type;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.recommendation = recommendation;
        this.confidence = confidence;
        this.matchedPattern = matchedPattern;
    }

    public String getType() { return type; }
    public String getSeverity() { return severity; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getRecommendation() { return recommendation; }
    public double getConfidence() { return confidence; }
    public String getMatchedPattern() { return matchedPattern; }
}

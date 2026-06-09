package com.springboot.MyTodoList.productivity;

public class SavingsEstimate {
    private final double estimatedHoursSaved;
    private final double estimatedMoneySaved;
    private final double hourlyRateUsd;
    private final String explanation;

    public SavingsEstimate(double estimatedHoursSaved, double estimatedMoneySaved,
            double hourlyRateUsd, String explanation) {
        this.estimatedHoursSaved = estimatedHoursSaved;
        this.estimatedMoneySaved = estimatedMoneySaved;
        this.hourlyRateUsd = hourlyRateUsd;
        this.explanation = explanation;
    }

    public double getEstimatedHoursSaved() { return estimatedHoursSaved; }
    public double getEstimatedMoneySaved() { return estimatedMoneySaved; }
    public double getHourlyRateUsd() { return hourlyRateUsd; }
    public String getExplanation() { return explanation; }
}

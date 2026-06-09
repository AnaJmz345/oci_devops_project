package com.springboot.MyTodoList.botai;

public class IntentMatchResult {
    private final String intentKey;
    private final double confidence;
    private final String matchedExample;

    public IntentMatchResult(String intentKey, double confidence, String matchedExample) {
        this.intentKey = intentKey;
        this.confidence = confidence;
        this.matchedExample = matchedExample;
    }

    public String getIntentKey() {
        return intentKey;
    }

    public double getConfidence() {
        return confidence;
    }

    public String getMatchedExample() {
        return matchedExample;
    }
}

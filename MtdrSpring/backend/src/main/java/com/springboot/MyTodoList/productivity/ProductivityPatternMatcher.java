package com.springboot.MyTodoList.productivity;

import com.springboot.MyTodoList.botai.IntentEmbeddingService;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProductivityPatternMatcher {
    private final IntentEmbeddingService embeddingService;
    private final List<ProductivityPattern> patterns;

    public ProductivityPatternMatcher(IntentEmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
        this.patterns = buildPatterns();
    }

    public MatchedPattern match(String observation) {
        float[] observationVector = embeddingService.embed(observation);
        MatchedPattern best = null;
        for (ProductivityPattern pattern : patterns) {
            for (String example : pattern.examples) {
                double score = cosine(observationVector, embeddingService.embed(example));
                if (best == null || score > best.confidence) {
                    best = new MatchedPattern(pattern, score, example);
                }
            }
        }
        return best;
    }

    private List<ProductivityPattern> buildPatterns() {
        List<ProductivityPattern> list = new ArrayList<>();
        list.add(new ProductivityPattern(
                "ESTIMATION_RISK",
                "warning",
                "Estimation variance",
                "Actual time is exceeding the planned estimate.",
                "Review estimation criteria, split large tasks, and capture recurring causes of variance.",
                List.of("actual hours over estimated hours", "actual time higher than estimate", "estimation variance")));
        list.add(new ProductivityPattern(
                "GOOD_ESTIMATION",
                "positive",
                "Healthy estimation",
                "The team is completing work within the planned estimates.",
                "Keep the current planning process and use these tasks as benchmarks for future estimates.",
                List.of("actual hours under estimated hours", "tasks within estimate", "good estimation hit rate")));
        list.add(new ProductivityPattern(
                "WORKLOAD_IMBALANCE",
                "warning",
                "Workload imbalance",
                "One team member is carrying a high share of assigned work.",
                "Redistribute work or use pair programming to reduce dependency on a single person.",
                List.of("one member has too many assigned tasks", "unbalanced workload", "user overload")));
        list.add(new ProductivityPattern(
                "QUALITY_RISK",
                "critical",
                "Quality risk",
                "Open bugs or a high defect density are affecting delivery quality.",
                "Prioritize open bug resolution before adding scope and review acceptance criteria.",
                List.of("many open bugs", "high defect density", "unresolved open bugs")));
        list.add(new ProductivityPattern(
                "LOW_PROGRESS",
                "critical",
                "Low delivery progress",
                "Sprint or project progress is below the expected level.",
                "Review blockers, reduce non-critical scope, and assign clear owners for in-progress work.",
                List.of("low sprint progress", "low sprint delivery", "few completed tasks")));
        list.add(new ProductivityPattern(
                "STRONG_DELIVERY",
                "positive",
                "Strong delivery",
                "The team shows strong progress with low variance.",
                "Document successful practices and repeat the same planning pattern in the next sprint.",
                List.of("strong team delivery", "high progress and few bugs", "healthy productivity")));
        return list;
    }

    private double cosine(float[] left, float[] right) {
        double dot = 0.0;
        double leftNorm = 0.0;
        double rightNorm = 0.0;
        for (int i = 0; i < left.length; i++) {
            dot += left[i] * right[i];
            leftNorm += left[i] * left[i];
            rightNorm += right[i] * right[i];
        }
        if (leftNorm == 0.0 || rightNorm == 0.0) {
            return 0.0;
        }
        return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
    }

    public static class MatchedPattern {
        private final ProductivityPattern pattern;
        private final double confidence;
        private final String matchedExample;

        MatchedPattern(ProductivityPattern pattern, double confidence, String matchedExample) {
            this.pattern = pattern;
            this.confidence = confidence;
            this.matchedExample = matchedExample;
        }

        public ProductivityPattern getPattern() { return pattern; }
        public double getConfidence() { return confidence; }
        public String getMatchedExample() { return matchedExample; }
    }

    public static class ProductivityPattern {
        private final String key;
        private final String severity;
        private final String title;
        private final String description;
        private final String recommendation;
        private final List<String> examples;

        ProductivityPattern(String key, String severity, String title, String description,
                String recommendation, List<String> examples) {
            this.key = key;
            this.severity = severity;
            this.title = title;
            this.description = description;
            this.recommendation = recommendation;
            this.examples = examples;
        }

        public String getKey() { return key; }
        public String getSeverity() { return severity; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getRecommendation() { return recommendation; }
    }
}

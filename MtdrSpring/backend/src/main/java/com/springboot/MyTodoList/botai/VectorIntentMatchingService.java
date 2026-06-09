package com.springboot.MyTodoList.botai;

import com.springboot.MyTodoList.botai.IntentCatalogService.IntentExample;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class VectorIntentMatchingService {
    private final IntentEmbeddingService embeddingService;
    private final IntentCatalogService catalogService;

    public VectorIntentMatchingService(IntentEmbeddingService embeddingService, IntentCatalogService catalogService) {
        this.embeddingService = embeddingService;
        this.catalogService = catalogService;
    }

    public Optional<IntentMatchResult> findBestIntent(String message) {
        float[] queryVector = embeddingService.embed(message);
        IntentMatchResult best = null;

        for (IntentExample example : catalogService.findActiveExamples()) {
            float[] exampleVector = embeddingService.embed(example.getText());
            double score = cosine(queryVector, exampleVector);
            if (best == null || score > best.getConfidence()) {
                best = new IntentMatchResult(example.getIntentKey(), score, example.getText());
            }
        }

        return Optional.ofNullable(best);
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
}

package com.springboot.MyTodoList.botai;

import java.text.Normalizer;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class LocalHashEmbeddingService implements IntentEmbeddingService {
    public static final int DIMENSIONS = 384;

    @Override
    public float[] embed(String text) {
        float[] vector = new float[DIMENSIONS];
        String normalized = normalize(text);
        if (normalized.isBlank()) {
            return vector;
        }

        for (String token : normalized.split("\\s+")) {
            if (token.isBlank()) {
                continue;
            }
            int index = Math.floorMod(token.hashCode(), DIMENSIONS);
            vector[index] += 1.0f;
            addCharacterNgrams(vector, token);
        }

        normalizeVector(vector);
        return vector;
    }

    private void addCharacterNgrams(float[] vector, String token) {
        if (token.length() < 3) {
            return;
        }
        for (int i = 0; i <= token.length() - 3; i++) {
            String ngram = token.substring(i, i + 3);
            int index = Math.floorMod(("ng:" + ngram).hashCode(), DIMENSIONS);
            vector[index] += 0.35f;
        }
    }

    public String normalize(String text) {
        String value = text == null ? "" : text;
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9@._\\s-]", " ")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private void normalizeVector(float[] vector) {
        double sum = 0.0;
        for (float value : vector) {
            sum += value * value;
        }
        double norm = Math.sqrt(sum);
        if (norm == 0.0) {
            return;
        }
        for (int i = 0; i < vector.length; i++) {
            vector[i] = (float) (vector[i] / norm);
        }
    }
}

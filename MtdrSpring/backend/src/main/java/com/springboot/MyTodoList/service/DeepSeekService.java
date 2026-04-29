package com.springboot.MyTodoList.service;

import java.io.IOException;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class DeepSeekService{
    private final CloseableHttpClient httpClient;
    private final HttpPost httpPost;
    private final String model;

    public DeepSeekService(CloseableHttpClient httpClient, HttpPost httpPost,
            @Value("${deepseek.api.model}") String model) {
        this.httpClient = httpClient;
        this.httpPost = httpPost;
        this.model = model;
    }

    public String generateText(String prompt) throws IOException, org.apache.hc.core5.http.ParseException {
        String requestBody = String.format("{\"model\": \"%s\",\"messages\": [{\"role\": \"user\", \"content\": \"%s\"}]}",
                escapeJson(model), escapeJson(prompt));

        try {
            httpPost.setEntity(new StringEntity(requestBody));
            CloseableHttpResponse response = httpClient.execute(httpPost);
            return EntityUtils.toString(response.getEntity());
        } catch (IOException e) {
            throw e;
        }
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}

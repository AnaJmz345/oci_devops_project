package com.springboot.MyTodoList.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DeepSeekConfig {

    @Value("${deepseek.api.key:}")
    private String apiKey;

    @Bean
    public Dotenv dotenv() {
        return Dotenv.configure()
                .ignoreIfMissing()
                .load();
    }

    @Bean
    public CloseableHttpClient httpClient() {
        return HttpClients.createDefault();
    }

    @Bean
    public HttpPost deepSeekRequest(@Value("${deepseek.api.url}") String apiUrl, Dotenv dotenv) {
        String resolvedApiKey = apiKey;

        if (resolvedApiKey == null || resolvedApiKey.isBlank() || resolvedApiKey.startsWith("${")) {
            resolvedApiKey = dotenv.get("GEMINI_API_KEY");
        }

        HttpPost request = new HttpPost(apiUrl);
        request.addHeader("Content-Type", "application/json");
        request.addHeader("Authorization", "Bearer " + resolvedApiKey);
        return request;
    }
}

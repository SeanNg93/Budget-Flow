package com.financeapp.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class DatabaseUrlParserConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${DB_USERNAME:}")
    private String dbUsername;

    @Value("${DB_PASSWORD:}")
    private String dbPassword;

    @Value("${spring.datasource.url:jdbc:mysql://localhost:3306/finance_db}")
    private String defaultUrl;

    @Value("${spring.datasource.username:root}")
    private String defaultUsername;

    @Value("${spring.datasource.password:123456}")
    private String defaultPassword;

    @PostConstruct
    public void parseDatabaseUrl() {
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            // Render provides DATABASE_URL in format: mysql://user:password@host:port/database
            try {
                URI uri = URI.parse(databaseUrl);
                
                String username = uri.getUserInfo() != null ? uri.getUserInfo().split(":")[0] : "";
                String password = uri.getUserInfo() != null && uri.getUserInfo().split(":").length > 1 
                    ? uri.getUserInfo().split(":")[1] : "";
                String host = uri.getHost();
                int port = uri.getPort();
                String database = uri.getPath() != null ? uri.getPath().substring(1) : "";
                
                // Override system properties that Spring will use
                System.setProperty("spring.datasource.url", 
                    String.format("jdbc:mysql://%s:%d/%s?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC", 
                        host, port, database));
                
                if (username != null && !username.isEmpty()) {
                    System.setProperty("spring.datasource.username", username);
                }
                if (password != null && !password.isEmpty()) {
                    System.setProperty("spring.datasource.password", password);
                }
                
                System.out.println("Parsed DATABASE_URL: host=" + host + ", port=" + port + ", database=" + database);
            } catch (Exception e) {
                System.err.println("Failed to parse DATABASE_URL: " + e.getMessage());
            }
        }
    }
}

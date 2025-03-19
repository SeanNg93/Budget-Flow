package com.financeapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * Centralized CORS Configuration for the application
 * This configuration is used by both Spring Security and Spring MVC
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * List of allowed origins for CORS requests
     * These are the environments where your frontend application will be deployed
     */
    private static final List<String> ALLOWED_ORIGINS = List.of(
            "http://localhost:3000", 
            "http://localhost:5173",
            "http://127.0.0.1:5173"
    );
    
    /**
     * HTTP methods that are allowed for CORS requests
     */
    private static final List<String> ALLOWED_METHODS = List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
    );
    
    /**
     * HTTP headers that are allowed for CORS requests
     */
    private static final List<String> ALLOWED_HEADERS = List.of(
            "Authorization", 
            "Content-Type", 
            "X-Auth-Token", 
            "X-Requested-With"
    );
    
    /**
     * HTTP headers that are exposed to the client browser
     */
    private static final List<String> EXPOSED_HEADERS = List.of(
            "Authorization", 
            "X-Auth-Token"
    );
    
    /**
     * Maximum age (in seconds) of the cache duration for preflight responses
     */
    private static final long MAX_AGE = 3600;

    /**
     * Configure CORS for Spring MVC
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(ALLOWED_ORIGINS.toArray(new String[0]))
                .allowedMethods(ALLOWED_METHODS.toArray(new String[0]))
                .allowedHeaders(ALLOWED_HEADERS.toArray(new String[0]))
                .exposedHeaders(EXPOSED_HEADERS.toArray(new String[0]))
                .allowCredentials(true)
                .maxAge(MAX_AGE);
    }

    /**
     * Configure CORS for Spring Security
     * This bean is used by the SecurityFilterChain in SecurityConfig
     */
    @Bean
    @Primary
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(ALLOWED_ORIGINS);
        configuration.setAllowedMethods(ALLOWED_METHODS);
        configuration.setAllowedHeaders(ALLOWED_HEADERS);
        configuration.setExposedHeaders(EXPOSED_HEADERS);
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(MAX_AGE);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
} 
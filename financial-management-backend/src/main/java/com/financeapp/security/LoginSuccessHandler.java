package com.financeapp.security;

import com.financeapp.service.UserDeletionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that cancels pending account deletions when a user logs in
 */
@RequiredArgsConstructor
@Slf4j
public class LoginSuccessHandler extends OncePerRequestFilter {

    private final UserDeletionService userDeletionService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        // Check if this is a login request
        if (request.getRequestURI().equals("/api/auth/login") && request.getMethod().equals("POST")) {
            // Get the authentication after the request is processed
            filterChain.doFilter(request, response);
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                
                // Check if user has a pending deletion
                if (userDeletionService.isUserPendingDeletion(username)) {
                    log.info("User {} logged in with pending deletion. Cancelling deletion.", username);
                    userDeletionService.cancelAccountDeletion(username);
                }
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
} 
package com.financeapp.controller;

import com.financeapp.exception.AuthenticationException;
import com.financeapp.exception.InsufficientFundsException;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        logger.error("AccessDeniedException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Access denied");
        response.put("message", "You do not have permission to access this resource");
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(InsufficientFundsException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientFundsException(InsufficientFundsException ex) {
        logger.error("InsufficientFundsException: {}", ex.getMessage());
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Insufficient funds");
        response.put("message", "Wallet balance not enough for this transaction");
        response.put("available", ex.getAvailable());
        response.put("required", ex.getRequired());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        logger.error("UsernameNotFoundException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Authentication failed");
        response.put("message", "Account not found");
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(BadCredentialsException ex) {
        logger.error("BadCredentialsException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Authentication failed");
        response.put("message", "Incorrect password");
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthenticationException(AuthenticationException ex) {
        logger.error("AuthenticationException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Authentication failed");
        response.put("message", ex.getMessage());
        response.put("code", ex.getErrorCode());
        // Always return BAD_REQUEST (400) for consistency with frontend expectations
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFoundException(EntityNotFoundException ex) {
        logger.error("EntityNotFoundException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Resource not found");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.error("IllegalArgumentException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Invalid request");
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        logger.error("DataIntegrityViolationException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Data integrity violation");
        response.put("message", "Operation could not be performed due to data constraints");
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        logger.error("MethodArgumentTypeMismatchException: {}", ex.getMessage());
        Map<String, String> response = new HashMap<>();
        response.put("error", "Invalid parameter");
        response.put("message", "Invalid value for parameter: " + ex.getName());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    // Generic exception handler as a fallback
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        logger.error("Unhandled exception caught: ", ex);
        Map<String, String> response = new HashMap<>();
        response.put("error", "Internal server error");
        response.put("message", "An unexpected error occurred. Please try again later.");
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
} 
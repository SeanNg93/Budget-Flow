package com.financeapp.exception;

import org.springframework.http.HttpStatus;

public class AuthenticationException extends RuntimeException {
    private final HttpStatus status;
    private final String errorCode;

    public AuthenticationException(String message, String errorCode, HttpStatus status) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    public AuthenticationException(String message, String errorCode) {
        this(message, errorCode, HttpStatus.BAD_REQUEST);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorCode() {
        return errorCode;
    }

    // Factory methods for common authentication errors
    public static AuthenticationException accountNotFound() {
        return new AuthenticationException("Account not found", "USER_NOT_FOUND");
    }

    public static AuthenticationException invalidCredentials() {
        return new AuthenticationException("Incorrect password", "INVALID_CREDENTIALS");
    }

    public static AuthenticationException accountLocked() {
        return new AuthenticationException("Account is locked", "ACCOUNT_LOCKED");
    }

    public static AuthenticationException accountDisabled() {
        return new AuthenticationException("Account is disabled", "ACCOUNT_DISABLED");
    }
} 
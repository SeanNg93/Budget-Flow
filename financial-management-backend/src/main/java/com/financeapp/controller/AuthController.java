package com.financeapp.controller;

import com.financeapp.dto.LoginRequest;
import com.financeapp.dto.JwtResponse;
import com.financeapp.exception.AuthenticationException;
import com.financeapp.model.Role;
import com.financeapp.model.User;
import com.financeapp.repository.RoleRepository;
import com.financeapp.repository.UserRepository;
import com.financeapp.security.JwtUtils;
import com.financeapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.HashSet;
import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        logger.info("Login attempt for user: {}", loginRequest.getUsername());
        
        try {
            // First check if the user exists
            Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());
            if (userOptional.isEmpty()) {
                // Check if it exists as an email
                userOptional = userRepository.findByEmail(loginRequest.getUsername());
                if (userOptional.isEmpty()) {
                    logger.warn("Login failed: Account not found for username/email: {}", loginRequest.getUsername());
                    throw AuthenticationException.accountNotFound();
                }
            }
            
            // Check if account is enabled
            User user = userOptional.get();
            
            // Add detailed logging for debugging the empty password issue
            logger.info("Found user: {} (ID: {}), Password hash present: {}, Account enabled: {}", 
                user.getUsername(),
                user.getId(),
                (user.getPassword() != null && !user.getPassword().isEmpty() ? "YES" : "NO"),
                user.isEnabled());
                
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                logger.error("User found but password is empty for user: {}", loginRequest.getUsername());
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Authentication failed",
                    "message", "Password data is missing. Please reset your password.",
                    "code", "EMPTY_PASSWORD"
                ));
            }
            
            if (!user.isEnabled()) {
                logger.warn("Login failed: Account not activated for user: {}", loginRequest.getUsername());
                throw AuthenticationException.accountDisabled();
            }
            
            // Check if account is pending deletion
            if (user.isPendingDeletion()) {
                logger.warn("Login failed: Account pending deletion for user: {}", loginRequest.getUsername());
                throw AuthenticationException.accountLocked();
            }
            
            // Authenticate the user
            Authentication authentication;
            try {
                authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
            } catch (BadCredentialsException e) {
                logger.warn("Login failed: Incorrect password for user: {}", loginRequest.getUsername());
                throw AuthenticationException.invalidCredentials();
            } catch (Exception e) {
                logger.error("Unexpected authentication error for user {}: {}", loginRequest.getUsername(), e.getMessage());
                throw new AuthenticationException("Authentication error: " + e.getMessage(), "AUTH_ERROR", HttpStatus.UNAUTHORIZED);
            }

            // Set the authentication in the security context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Generate JWT token
            String jwt = jwtUtils.generateToken(authentication);
            
            // Get user details from the authentication
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Extract roles as strings
            List<String> roles = user.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toList());
            
            logger.info("Login successful for user: {}", loginRequest.getUsername());
            
            // Return the JWT response with user details
            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    roles
            ));
        } catch (AuthenticationException e) {
            // The custom exception already has the right message, just return it
            logger.error("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(e.getStatus()).body(Map.of(
                "error", "Authentication failed",
                "message", e.getMessage(),
                "code", e.getErrorCode()
            ));
        } catch (Exception e) {
            logger.error("Login failed for user: {}", loginRequest.getUsername(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Authentication failed",
                "message", "An unexpected error occurred. Please try again later."
            ));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody LoginRequest registerRequest) {
        logger.info("Registration attempt for user: {}", registerRequest.getUsername());
        
        try {
            Optional<User> userExists = userRepository.findByUsername(registerRequest.getUsername());
            if (userExists.isPresent()) {
                logger.warn("Registration failed: Username already exists: {}", registerRequest.getUsername());
                return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "Username already exists!"));
            }

            // Check if email already exists
            Optional<User> emailExists = userRepository.findByEmail(registerRequest.getEmail());
            if (emailExists.isPresent()) {
                logger.warn("Registration failed: Email already exists: {}", registerRequest.getEmail());
                return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "Email already exists!"));
            }

            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setEnabled(false); // User is disabled until activation

            // Assign default ROLE_USER role
            Role userRole = roleRepository.findByName(Role.ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: Role ROLE_USER not found"));
            user.setRoles(new HashSet<>(Collections.singletonList(userRole)));

            userRepository.save(user);
            logger.info("User registered successfully: {}", registerRequest.getUsername());

            // Generate activation token and return it
            Map<String, String> activationResult = userService.createActivationToken(user);

            return ResponseEntity.ok(activationResult);
        } catch (Exception e) {
            logger.error("Registration failed for user: {}", registerRequest.getUsername(), e);
            return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "Registration failed: " + e.getMessage()));
        }
    }
    
    // Simple test endpoint to verify the controller is accessible
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        logger.info("Test endpoint accessed");
        return ResponseEntity.ok(Map.of("message", "Auth controller is working!"));
    }

    /**
     * Check if a username is available
     */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsernameAvailability(@RequestParam String username) {
        logger.info("Checking username availability: {}", username);
        
        // Validate the username
        if (username == null || username.trim().isEmpty() || username.length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("available", false, "message", "Username is invalid"));
        }
        
        // Check if username exists
        boolean isAvailable = userRepository.findByUsername(username).isEmpty();
        
        logger.info("Username {} is {}", username, isAvailable ? "available" : "taken");
        
        return ResponseEntity.ok(Map.of("available", isAvailable));
    }

    /**
     * Check if an email is available
     */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmailAvailability(@RequestParam String email) {
        logger.info("Checking email availability: {}", email);
        
        // Validate the email (basic validation)
        if (email == null || email.trim().isEmpty() || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("available", false, "message", "Email is invalid"));
        }
        
        // Check if email exists
        boolean isAvailable = userRepository.findByEmail(email).isEmpty();
        
        logger.info("Email {} is {}", email, isAvailable ? "available" : "taken");
        
        return ResponseEntity.ok(Map.of("available", isAvailable));
    }
}
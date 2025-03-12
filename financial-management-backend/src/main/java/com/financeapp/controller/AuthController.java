package com.financeapp.controller;

import com.financeapp.dto.LoginRequest;
import com.financeapp.dto.JwtResponse;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.security.JwtUtils;
import com.financeapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateToken(authentication);

        return ResponseEntity.ok(new JwtResponse(jwt));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody LoginRequest registerRequest) {
        Optional<User> userExists = userRepository.findByUsername(registerRequest.getUsername());
        if (userExists.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "Username already exists!"));
        }

        // Check if email already exists
        Optional<User> emailExists = userRepository.findByEmail(registerRequest.getEmail());
        if (emailExists.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("success", "false", "message", "Email already exists!"));
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEnabled(false); // User is disabled until activation

        userRepository.save(user);

        // Generate activation token and return it
        Map<String, String> activationResult = userService.createActivationToken(user);

        return ResponseEntity.ok(activationResult);
    }
}
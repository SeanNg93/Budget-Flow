package com.financeapp.controller;

import com.financeapp.dto.UserProfileDto;
import com.financeapp.model.User;
import com.financeapp.model.UserProfile;
import com.financeapp.repository.UserProfileRepository;
import com.financeapp.repository.UserRepository;
import com.financeapp.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserProfileController {

    private final UserProfileService userProfileService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    
    @Value("${app.upload.dir:uploads/profile-pictures}")
    private String uploadDir;

    /**
     * Get current user's profile
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDto> getCurrentUserProfile(Authentication authentication) {
        String username = authentication.getName();
        UserProfileDto profile = userProfileService.getUserProfileByUsername(username);
        return ResponseEntity.ok(profile);
    }

    /**
     * Get user profile by ID
     */
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#userId)")
    public ResponseEntity<UserProfileDto> getUserProfile(@PathVariable Long userId) {
        try {
            UserProfileDto profile = userProfileService.getUserProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Error getting profile for user ID {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update user profile
     */
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#userId)")
    public ResponseEntity<UserProfileDto> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody UserProfileDto profileDto) {
        try {
            UserProfileDto updatedProfile = userProfileService.updateUserProfile(userId, profileDto);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            log.error("Error updating profile for user ID {}: {}", userId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Upload profile picture
     */
    @PostMapping("/{userId}/picture")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.isCurrentUser(#userId)")
    public ResponseEntity<UserProfileDto> uploadProfilePicture(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file) {
        try {
            UserProfileDto updatedProfile = userProfileService.uploadProfilePicture(userId, file);
            return ResponseEntity.ok(updatedProfile);
        } catch (IOException e) {
            log.error("Error uploading profile picture: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    /**
     * Get profile picture
     */
    @GetMapping("/picture/{userId}")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable Long userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();
            Optional<UserProfile> profileOpt = userProfileRepository.findByUser(user);
            
            if (profileOpt.isEmpty() || profileOpt.get().getProfilePicturePath() == null) {
                return ResponseEntity.notFound().build();
            }
            
            String filePath = profileOpt.get().getProfilePicturePath();
            
            Path path = Paths.get(filePath);
            Resource resource;
            
            try {
                resource = new UrlResource(path.toUri());
                if (resource.exists() && resource.isReadable()) {
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                            .contentType(MediaType.IMAGE_JPEG)
                            .body(resource);
                } else {
                    return ResponseEntity.notFound().build();
                }
            } catch (MalformedURLException e) {
                log.error("Error loading profile picture: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        } catch (Exception e) {
            log.error("Error getting profile picture: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
} 
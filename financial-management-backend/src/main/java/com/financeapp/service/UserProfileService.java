package com.financeapp.service;

import com.financeapp.dto.UserProfileDto;
import com.financeapp.model.User;
import com.financeapp.model.UserProfile;
import com.financeapp.repository.UserProfileRepository;
import com.financeapp.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    
    @Value("${app.upload.dir:uploads/profile-pictures}")
    private String uploadDir;
    
    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;
    
    /**
     * Get user profile by user ID
     */
    public UserProfileDto getUserProfile(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        Optional<UserProfile> profileOpt = userProfileRepository.findByUser(user);
        
        if (profileOpt.isEmpty()) {
            // Create a default profile if none exists
            return createDefaultProfile(user);
        }
        
        return mapToDto(profileOpt.get(), user);
    }
    
    /**
     * Get user profile by username
     */
    public UserProfileDto getUserProfileByUsername(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        Optional<UserProfile> profileOpt = userProfileRepository.findByUser(user);
        
        if (profileOpt.isEmpty()) {
            // Create a default profile if none exists
            return createDefaultProfile(user);
        }
        
        return mapToDto(profileOpt.get(), user);
    }
    
    /**
     * Update user profile
     */
    @Transactional
    public UserProfileDto updateUserProfile(Long userId, UserProfileDto profileDto) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElse(UserProfile.builder().user(user).build());
        
        // Update profile fields
        profile.setFullName(profileDto.getFullName());
        profile.setPhone(profileDto.getPhone());
        profile.setBio(profileDto.getBio());
        // Do not update role from the DTO to prevent users from changing their role
        // profile.setRole(profileDto.getRole());
        
        // Save the profile
        UserProfile savedProfile = userProfileRepository.save(profile);
        
        return mapToDto(savedProfile, user);
    }
    
    /**
     * Upload profile picture
     */
    @Transactional
    public UserProfileDto uploadProfilePicture(Long userId, MultipartFile file) throws IOException {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.error("User not found with ID: {}", userId);
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElse(UserProfile.builder().user(user).build());
        
        // Create upload directory if it doesn't exist
        File uploadDirFile = new File(uploadDir);
        if (!uploadDirFile.exists()) {
            boolean created = uploadDirFile.mkdirs();
            if (!created) {
                log.error("Failed to create upload directory: {}", uploadDir);
                throw new IOException("Failed to create upload directory: " + uploadDir);
            }
        }
        
        Path uploadPath = Paths.get(uploadDir);
        
        // Generate a unique filename
        String originalFilename = file.getOriginalFilename();
        String filename = UUID.randomUUID().toString() + "_" + (originalFilename != null ? originalFilename : "profile.jpg");
        Path filePath = uploadPath.resolve(filename);
        
        // Save the file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Delete old profile picture if exists
        if (profile.getProfilePicturePath() != null) {
            try {
                Path oldFilePath = Paths.get(profile.getProfilePicturePath());
                Files.deleteIfExists(oldFilePath);
            } catch (IOException e) {
                // Log error but continue
                log.error("Failed to delete old profile picture: {}", e.getMessage());
            }
        }
        
        // Store the relative path to the file
        String relativePath = uploadDir + "/" + filename;
        profile.setProfilePicturePath(relativePath);
        UserProfile savedProfile = userProfileRepository.save(profile);
        
        return mapToDto(savedProfile, user);
    }
    
    /**
     * Create a default profile for a user
     */
    @Transactional
    public UserProfileDto createDefaultProfile(User user) {
        UserProfile profile = UserProfile.builder()
                .user(user)
                .fullName(user.getUsername())
                .joinDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                .role("User")
                .build();
        
        UserProfile savedProfile = userProfileRepository.save(profile);
        return mapToDto(savedProfile, user);
    }
    
    /**
     * Map UserProfile entity to UserProfileDto
     */
    private UserProfileDto mapToDto(UserProfile profile, User user) {
        String profilePictureUrl = null;
        if (profile.getProfilePicturePath() != null) {
            // Convert file path to URL
            profilePictureUrl = baseUrl + "/uploads/" + Paths.get(profile.getProfilePicturePath()).getFileName();
        }
        
        return UserProfileDto.builder()
                .id(profile.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(profile.getFullName())
                .phone(profile.getPhone())
                .bio(profile.getBio())
                .joinDate(profile.getJoinDate())
                .role(profile.getRole())
                .profilePictureUrl(profilePictureUrl)
                .build();
    }
} 
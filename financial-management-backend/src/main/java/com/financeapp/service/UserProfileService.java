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
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
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

        // Thêm cập nhật các trường mới
        if (profileDto.getDateOfBirth() != null && !profileDto.getDateOfBirth().isEmpty()) {
            profile.setDateOfBirth(LocalDate.parse(profileDto.getDateOfBirth()));
        }
        profile.setAddress(profileDto.getAddress());

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
                .totalBalance(BigDecimal.ZERO)
                .currency("USD")
                .dateOfBirth(null)
                .address(null)
                .build();

        UserProfile savedProfile = userProfileRepository.save(profile);
        return mapToDto(savedProfile, user);
    }

    /**
     * Get the total balance for a user
     *
     * @param userId User ID
     * @return Total balance
     */
    public BigDecimal getTotalBalance(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    // Create default profile if none exists
                    UserProfile newProfile = UserProfile.builder()
                            .user(user)
                            .fullName(user.getUsername())
                            .joinDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                            .role("User")
                            .totalBalance(BigDecimal.ZERO)
                            .currency("USD")
                            .build();
                    return userProfileRepository.save(newProfile);
                });

        return profile.getTotalBalance();
    }

    /**
     * Add to the total balance
     *
     * @param userId User ID
     * @param amount Amount to add
     * @return New total balance
     */
    @Transactional
    public BigDecimal addToTotalBalance(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive to add to balance");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    // Create default profile if none exists
                    return UserProfile.builder()
                            .user(user)
                            .fullName(user.getUsername())
                            .joinDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                            .role("User")
                            .totalBalance(BigDecimal.ZERO)
                            .currency("USD")
                            .build();
                });

        // Add to total balance
        BigDecimal newBalance = profile.getTotalBalance().add(amount);
        profile.setTotalBalance(newBalance);
        userProfileRepository.save(profile);

        return newBalance;
    }

    /**
     * Subtract from the total balance
     *
     * @param userId User ID
     * @param amount Amount to subtract
     * @return New total balance
     */
    @Transactional
    public BigDecimal subtractFromTotalBalance(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be positive to subtract from balance");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Check if there's enough balance
        if (profile.getTotalBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient total balance");
        }

        // Subtract from total balance
        BigDecimal newBalance = profile.getTotalBalance().subtract(amount);
        profile.setTotalBalance(newBalance);
        userProfileRepository.save(profile);

        return newBalance;
    }

    /**
     * Update total balance to a new amount
     *
     * @param userId User ID
     * @param newBalance New balance amount
     * @return Updated total balance
     */
    @Transactional
    public BigDecimal updateTotalBalance(Long userId, BigDecimal newBalance) {
        if (newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total balance cannot be negative");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    // Create default profile if none exists
                    return UserProfile.builder()
                            .user(user)
                            .fullName(user.getUsername())
                            .joinDate(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")))
                            .role("User")
                            .totalBalance(BigDecimal.ZERO)
                            .currency("USD")
                            .build();
                });

        // Set the new total balance
        profile.setTotalBalance(newBalance);
        userProfileRepository.save(profile);

        return newBalance;
    }

    /**
     * Map UserProfile entity to UserProfileDto
     */
    private UserProfileDto mapToDto(UserProfile profile, User user) {
        String profilePictureUrl = null;
        if (profile.getProfilePicturePath() != null) {
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
                .totalBalance(profile.getTotalBalance())
                .currency(profile.getCurrency())
                .dateOfBirth(profile.getDateOfBirth() != null ?
                        profile.getDateOfBirth().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : null)
                .address(profile.getAddress())
                .build();
    }
}
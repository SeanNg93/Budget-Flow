package com.financeapp.controller;

import com.financeapp.dto.ChangePasswordRequest;
//import com.financeapp.model.RoleName;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import com.financeapp.security.JwtUtils;
import com.financeapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final UserService userService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/delete/{username}")
    public ResponseEntity<String> deleteUser(@PathVariable String username) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        Optional<User> userToDelete = userRepository.findByUsername(username);

        if (userToDelete.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User user = userToDelete.get();

        // Nếu là USER, chỉ cho phép xóa chính mình
        if (!isAdmin && !currentUsername.equals(username)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own account");
        }

//        // Ngăn Admin xóa Admin khác nếu cần (tùy chọn)
//        if (isAdmin && user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ROLE_ADMIN)) {
//            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Admins cannot delete other admins");
//        }


        userRepository.delete(user);
        return ResponseEntity.ok("User deleted successfully");
    }

    @DeleteMapping("/delete-account")
    public ResponseEntity<?> deleteOwnAccount(Authentication authentication, @RequestParam("password") String password) {
        String username = authentication.getName();
        boolean deleted = userService.deleteUserAccount(username, password);
        if (deleted) {
            return ResponseEntity.ok(Map.of("success", "true", "message", "Tài khoản đã được xoá thành công."));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", "false", "message", "Xác thực thất bại hoặc không thể xoá tài khoản."));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getUser(Authentication authentication) {
        OAuth2User user = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> response = new HashMap<>(user.getAttributes());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        // Extract username from the request
        String username = request.getCurrentPassword().split(":")[0];
        String currentPassword = request.getCurrentPassword().split(":")[1];
        
        boolean changed = userService.changePassword(username, currentPassword, request.getNewPassword());
        
        if (changed) {
            return ResponseEntity.ok(Map.of("success", "true", "message", "Password changed successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", "false", "message", "Current password is incorrect or user not found"));
        }
    }
}
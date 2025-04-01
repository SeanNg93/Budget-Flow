package com.financeapp.security;

import com.financeapp.exception.AuthenticationException;
import com.financeapp.model.User;
import com.financeapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final UserRepository userRepository;

    @Autowired
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    // Temporarily disable cache to troubleshoot empty password issue
    // @Cacheable(value = "userCache", key = "#usernameOrEmail")
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // Only log at debug level for cache misses
        logger.debug("Attempting to load user: {}", usernameOrEmail);
        
        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> {
                    logger.error("User not found with username or email: {}", usernameOrEmail);
                    return AuthenticationException.accountNotFound();
                });

        if (!user.isEnabled()) {
            logger.error("User account is not activated: {}", usernameOrEmail);
            throw AuthenticationException.accountDisabled();
        }

        if (user.isPendingDeletion()) {
            logger.error("User account is pending deletion: {}", usernameOrEmail);
            throw AuthenticationException.accountLocked();
        }

        // Add explicit password null check and logging
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            logger.error("User found but password is empty for user: {}", usernameOrEmail);
            throw new AuthenticationException("Empty password hash found", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED);
        }

        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> {
                    String roleName = role.getName().name();
                    logger.debug("User {} has role: {}", usernameOrEmail, roleName);
                    return new SimpleGrantedAuthority(roleName);
                })
                .collect(Collectors.toList());

        logger.debug("Successfully loaded user: {}", usernameOrEmail);
        
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),   // luôn trả về username để đảm bảo JWT đúng định dạng
                user.getPassword(),
                authorities
        );
    }
    
    /**
     * Evicts a specific user from the cache
     * @param username the username of the user to evict
     */
    @CacheEvict(value = "userCache", key = "#username")
    public void evictUserFromCache(String username) {
        logger.debug("Evicting user from cache: {}", username);
    }
    
    /**
     * Evicts all users from the cache
     */
    @CacheEvict(value = "userCache", allEntries = true)
    public void evictAllUsersFromCache() {
        logger.debug("Evicting all users from cache");
    }

    /**
     * Evicts a specific user from the cache using both username and email as potential keys.
     * @param user the User object containing username and email
     */
    @Caching(evict = {
        @CacheEvict(value = "userCache", key = "#user.username"),
        @CacheEvict(value = "userCache", key = "#user.email")
    })
    public void evictUserFromCacheByUsernameAndEmail(User user) {
        if (user != null) {
            logger.debug("Evicting user from cache by username ({}) and email ({})", user.getUsername(), user.getEmail());
        } else {
            logger.warn("Attempted to evict null user from cache");
        }
    }
}

package com.financeapp.repository;

import com.financeapp.model.DeletedUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeletedUserRepository extends JpaRepository<DeletedUser, Long> {
    Optional<DeletedUser> findByOriginalUserId(Long originalUserId);
    Optional<DeletedUser> findByUsername(String username);
    Optional<DeletedUser> findByEmail(String email);
} 
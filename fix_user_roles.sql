-- Fix user roles script
-- This script assigns the default ROLE_USER role to any users who don't have a role

-- First, identify users without roles
SELECT u.id, u.username, u.email
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- Insert the default ROLE_USER role for users who don't have any roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
AND r.name = 'ROLE_USER';

-- Verify that all users now have at least one role
SELECT u.id, u.username, u.email, COUNT(ur.role_id) as role_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.username, u.email
ORDER BY u.id; 
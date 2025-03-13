import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import styles from '../styles/delete-account.module.css';

export default function DeleteAccount() {
    const [password, setPassword] = useState('');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!password.trim()) {
            alert("Please enter your password to confirm.");
            return;
        }

        const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
        if (!confirmed) return;

        setIsLoading(true);
        try {
            // Get token from localStorage and verify
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Your session has expired. Please log in again.");
                router.push('/login');
                return;
            }

            console.log('Token being used:', token); // Debug log

            // Use fetch instead of axios
            const response = await fetch(
                `http://localhost:8080/api/user/delete-account?password=${encodeURIComponent(password)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            // Check status code
            if (response.status === 403) {
                throw new Error('Access denied. Please log in again.');
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success === true || data.success === "true") {
                alert("Account deleted successfully!");
                localStorage.clear();
                router.push('/register');
            } else {
                alert(data.message || "An error occurred.");
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('log in again')) {
                localStorage.clear();
                router.push('/login');
            } else {
                alert("Error: " + (error.message || "An error occurred, please try again later."));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.deleteAccountForm}>
                <h2 className={styles.title}>Delete Account</h2>
                <p className={styles.warning}>
                    This action will delete all your related information and cannot be undone.
                </p>

                <div className={styles.formGroup}>
                    <input
                        type="password"
                        placeholder="Enter your password to confirm"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className={styles.cancelButton}
                        disabled={isLoading}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleDelete}
                        className={styles.deleteButton}
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading ? "Processing..." : "I'm sure, delete my account"}
                    </button>
                </div>
            </div>
        </div>
    );
}

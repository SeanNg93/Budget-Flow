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
            alert("Vui lòng nhập mật khẩu để xác nhận.");
            return;
        }

        const confirmed = window.confirm('Bạn có chắc chắn muốn xoá tài khoản? Hành động này sẽ không thể hoàn tác.');
        if (!confirmed) return;

        setIsLoading(true);
        try {
            // Lấy token từ localStorage và kiểm tra
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                router.push('/login');
                return;
            }

            console.log('Token being used:', token); // Debug log

            // Sử dụng fetch thay vì axios
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

            // Kiểm tra status code
            if (response.status === 403) {
                throw new Error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success === true || data.success === "true") {
                alert("Xóa tài khoản thành công!");
                localStorage.clear();
                router.push('/register');
            } else {
                alert(data.message || "Có lỗi xảy ra.");
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('đăng nhập lại')) {
                localStorage.clear();
                router.push('/login');
            } else {
                alert("Lỗi: " + (error.message || "Có lỗi xảy ra, vui lòng thử lại sau."));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.deleteAccountForm}>
                <h2 className={styles.title}>Xoá Tài Khoản</h2>
                <p className={styles.warning}>
                    Hành động này sẽ xóa tất cả thông tin liên quan của bạn và không thể hoàn tác.
                </p>

                <div className={styles.formGroup}>
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu để xác nhận"
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
                        Quay lại
                    </button>
                    <button
                        onClick={handleDelete}
                        className={styles.deleteButton}
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading ? "Đang xử lý..." : "Tôi chắc chắn xoá tài khoản"}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/home.module.css';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập từ localStorage hoặc session
    const userToken = localStorage.getItem('userToken');
    if (userToken) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    router.push('/login');
  };

  return (
    <div className={styles['home-container']}>
      <h1>Trang Chủ</h1>
      
      {!isLoggedIn ? (
        <div className={styles['auth-buttons']}>
          <Link href="/login" className={`${styles.btn} ${styles['btn-primary']}`}>
            Đăng nhập
          </Link>
          <Link href="/register" className={`${styles.btn} ${styles['btn-secondary']}`}>
            Đăng ký
          </Link>
        </div>
      ) : (
        <div className={styles['user-actions']}>
          <button onClick={handleLogout} className={`${styles.btn} ${styles['btn-warning']}`}>
            Đăng xuất
          </button>
          <Link href="/delete-account" className={`${styles.btn} ${styles['btn-danger']}`}>
            Xóa tài khoản
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home;
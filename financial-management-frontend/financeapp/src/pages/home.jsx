import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../styles/home.module.css';

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

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
    navigate('/login');
  };

  return (
    <div className={styles['home-container']}>
      <h1>Home</h1>
      
      {!isLoggedIn ? (
        <div className={styles['auth-buttons']}>
          <Link to="/login" className={`${styles.btn} ${styles['btn-primary']}`}>
            Login
          </Link>
          <Link to="/register" className={`${styles.btn} ${styles['btn-secondary']}`}>
            Register
          </Link>
        </div>
      ) : (
        <div className={styles['user-actions']}>
          <button onClick={handleLogout} className={`${styles.btn} ${styles['btn-warning']}`}>
            Logout
          </button>
          <Link to="/dashboard" className={`${styles.btn} ${styles['btn-primary']}`}>
            Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

export default Home; 
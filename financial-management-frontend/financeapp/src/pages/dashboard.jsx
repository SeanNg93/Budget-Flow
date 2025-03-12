import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../styles/dashboard.module.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // const token = Cookies.get("access_token");
    const token = window.localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const userData = localStorage.getItem("userData");
      setUser(JSON.parse(userData));
    } catch (err) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userData");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <h1>Dashboard</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Đăng xuất
          </button>
        </div>
      </nav>

      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.userInfo}>
            <h3>{user?.username}</h3>
            <p>{user?.email}</p>
          </div>
          <nav className={styles.sidebarNav}>
            <ul>
              <li>
                <Link to="/dashboard" className="home-text">Trang chủ</Link>
              </li>
              <li>
                <Link to="/delete-account" className={styles.deleteAccountButton}>
                  Xóa tài khoản
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
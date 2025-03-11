import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Cookies from "js-cookie";
import styles from "../styles/dashboard.module.css";

export default function Dashboard() {
  const router = useRouter();
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
      router.push("/login");
      return;
    }

    try {
      const userData = localStorage.getItem("userData");
      console.log(userData)
      // setUser(JSON.parse(userData));
    } catch (err) {
      // Cookies.remove("access_token");
      // localStorage.removeItem("userData");
      // router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("access_token");
    localStorage.removeItem("userData");
    router.push("/login");
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
                <Link className="home-text" href="/dashboard">Trang chủ</Link>
              </li>
              <li>
                <Link href="/delete-account" className={styles.deleteAccountButton}>
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
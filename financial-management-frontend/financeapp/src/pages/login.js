import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { login } from "../services/api";
import Link from "next/link";
import styles from "../styles/login.module.css";

export default function Login() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await login(data.username, data.password);
      console.log("Response from API:", response.data);

      if (response.data.token) {
        localStorage.setItem("userToken", response.data.token);
        router.push("/dashboard"); // Chuyển hướng sau khi đăng nhập thành công
      } else {
        setError("Đăng nhập thất bại. Máy chủ không phản hồi hợp lệ.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginFormWrapper}>
        <div className={styles.loginHeader}>
          <h2>Đăng nhập</h2>
          <p>
            Hoặc{" "}
            <Link href="/register" className={styles.loginLink}>
              tạo tài khoản mới
            </Link>
          </p>
        </div>

        {error && (
          <div className={styles.alertDanger}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              name="username"
              type="text"
              className={styles.formInput}
              placeholder="Tên đăng nhập"
              {...register("username", { required: "Tên đăng nhập không được để trống" })}
            />
            {errors.username && <p className={styles.errorMessage}>{errors.username.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.formInput}
              placeholder="Mật khẩu"
              {...register("password", { required: "Mật khẩu không được để trống" })}
            />
            {errors.password && <p className={styles.errorMessage}>{errors.password.message}</p>}
          </div>

          <div className={styles.forgotPasswordLink}>
            <Link href="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button type="submit" disabled={isSubmitting} className={styles.loginButton}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

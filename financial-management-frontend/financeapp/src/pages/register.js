import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { register as registerUser } from "../services/api";
import { sendForm } from "@emailjs/browser";
import { EMAILJS_CONFIG } from "../config/emailjs.config";
import Link from "next/link";
import styles from "../styles/register.module.css";

export default function Register() {
  const activationFormRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activationData, setActivationData] = useState(null);

  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm();
  
  const password = watch("password", "");

  // Xử lý đăng ký tài khoản
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await registerUser(data.username, data.email, data.password);
      setIsSuccess(true);

      if (response.data && response.data.activationLink) {
        setMessage(`Đăng ký thành công! Chuẩn bị gửi email kích hoạt tới ${data.email}...`);
        setActivationData({
          to_email: data.email,
          activation_link: response.data.activationLink,
        });
      } else {
        setMessage("Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.");
      }
    } catch (error) {
      setIsSuccess(false);
      const errorMessage =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gửi email kích hoạt tài khoản
  const sendActivationEmail = async () => {
    if (!activationData) return;
    
    setIsSendingEmail(true);
    setMessage(`Đang gửi email kích hoạt tới ${activationData.to_email}...`);

    try {
      await sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.activationTemplateId,
        activationFormRef.current,
        EMAILJS_CONFIG.publicKey
      );

      setMessage(`Email kích hoạt đã được gửi tới ${activationData.to_email}.`);
    } catch (error) {
      console.error("Gửi email thất bại:", error);
      setMessage(`Không thể gửi email kích hoạt. Vui lòng thử lại.`);
      setIsSuccess(false);
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    if (activationData) {
      sendActivationEmail();
    }
  }, [activationData]);

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerFormWrapper}>
        <div className={styles.registerHeader}>
          <h2>Đăng ký tài khoản</h2>
          <p>
            Hoặc{" "}
            <Link href="/login" className={styles.loginLink}>
              đăng nhập vào tài khoản của bạn
            </Link>
          </p>
        </div>

        {message && (
          <div className={isSuccess ? styles.alertSuccess : styles.alertDanger}>
            <p>{message}</p>
          </div>
        )}

        {/* Form ẩn để gửi email kích hoạt */}
        <form ref={activationFormRef} style={{ display: "none" }}>
          <input type="hidden" name="to_email" value={activationData?.to_email || ""} />
          <input type="hidden" name="activation_link" value={activationData?.activation_link || ""} />
        </form>

        {!isSuccess && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                id="username"
                name="username"
                type="text"
                className={styles.formInput}
                placeholder="Tên đăng nhập"
                {...register("username", { required: "Tên đăng nhập không được để trống", minLength: { value: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự" } })}
              />
              {errors.username && <p className={styles.errorMessage}>{errors.username.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className={styles.formInput}
                placeholder="Nhập email của bạn"
                {...register("email", { required: "Email không được để trống", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Email không hợp lệ" } })}
              />
              {errors.email && <p className={styles.errorMessage}>{errors.email.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                className={styles.formInput}
                placeholder="Nhập mật khẩu"
                {...register("password", { required: "Mật khẩu không được để trống", minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" } })}
              />
              {errors.password && <p className={styles.errorMessage}>{errors.password.message}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={styles.formInput}
                placeholder="Xác nhận mật khẩu"
                {...register("confirmPassword", { required: "Vui lòng nhập lại mật khẩu", validate: value => value === password || "Mật khẩu không khớp" })}
              />
              {errors.confirmPassword && <p className={styles.errorMessage}>{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting || isSendingEmail} className={styles.registerButton}>
              {isSubmitting ? "Đang đăng ký..." : isSendingEmail ? "Đang gửi email..." : "Đăng ký"}
            </button>
          </form>
        )}

        {isSuccess && (
          <div className={styles.loginLink}>
            <Link href="/login">Quay lại trang đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
}

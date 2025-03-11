import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { register as registerUser } from "../services/api";
import { sendForm } from "@emailjs/browser";
import { EMAILJS_CONFIG } from "../config/emailjs.config";

// Material UI imports
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

// Validation schema
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
    .max(20, "Tên đăng nhập không được vượt quá 20 ký tự")
    .required("Tên đăng nhập không được để trống"),
  email: Yup.string()
    .email("Email không hợp lệ")
    .required("Email không được để trống"),
  password: Yup.string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .required("Mật khẩu không được để trống"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Mật khẩu xác nhận không khớp")
    .required("Xác nhận mật khẩu không được để trống"),
});

export default function Register() {
  const router = useRouter();
  const activationFormRef = useRef();
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activationData, setActivationData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Xử lý đăng ký tài khoản
  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage("");

    try {
      const response = await registerUser(values.username, values.email, values.password);
      setIsSuccess(true);

      if (response.data && response.data.activationLink) {
        setMessage(`Đăng ký thành công! Chuẩn bị gửi email kích hoạt tới ${values.email}...`);
        setActivationData({
          to_email: values.email,
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
      setSubmitting(false);
    }
  };

  // Gửi email kích hoạt
  const sendActivationEmail = async () => {
    if (!activationData) return;

    setIsSendingEmail(true);
    try {
      const result = await sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.activationTemplateId,
        activationFormRef.current,
        EMAILJS_CONFIG.publicKey
      );

      if (result.status === 200) {
        setMessage(`Đăng ký thành công! Email kích hoạt đã được gửi tới ${activationData.to_email}`);
      } else {
        setMessage(
          "Đăng ký thành công, nhưng không thể gửi email kích hoạt. Vui lòng liên hệ quản trị viên."
        );
      }
    } catch (error) {
      console.error("Error sending activation email:", error);
      setMessage(
        "Đăng ký thành công, nhưng không thể gửi email kích hoạt. Vui lòng liên hệ quản trị viên."
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Gửi email kích hoạt khi có dữ liệu
  useEffect(() => {
    if (activationData) {
      sendActivationEmail();
    }
  }, [activationData]);

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box
            sx={{
              backgroundColor: "primary.main",
              borderRadius: "50%",
              p: 1,
              mb: 1,
              color: "white",
            }}
          >
            <PersonAddIcon />
          </Box>
          <Typography component="h1" variant="h5">
            Đăng ký tài khoản
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Đã có tài khoản?{" "}
            <Link href="/login" style={{ color: "primary.main" }}>
              Đăng nhập
            </Link>
          </Typography>
        </Box>

        {message && (
          <Alert severity={isSuccess ? "success" : "error"} sx={{ width: "100%", mb: 2 }}>
            {message}
          </Alert>
        )}

        {isSendingEmail && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>Đang gửi email kích hoạt...</Typography>
          </Box>
        )}

        {!isSuccess && (
          <Formik
            initialValues={{
              username: "",
              email: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ width: "100%" }}>
                <Field name="username">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="username"
                      label="Tên đăng nhập"
                      autoComplete="username"
                      autoFocus
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>

                <Field name="email">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="email"
                      label="Email"
                      autoComplete="email"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>

                <Field name="password">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      label="Mật khẩu"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </Field>

                <Field name="confirmPassword">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      label="Xác nhận mật khẩu"
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowConfirmPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                </Field>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </Form>
            )}
          </Formik>
        )}

        {/* Hidden form for EmailJS */}
        <form ref={activationFormRef} style={{ display: "none" }}>
          <input type="text" name="to_email" defaultValue={activationData?.to_email || ""} />
          <input
            type="text"
            name="activation_link"
            defaultValue={activationData?.activation_link || ""}
          />
        </form>
      </Paper>
    </Container>
  );
}

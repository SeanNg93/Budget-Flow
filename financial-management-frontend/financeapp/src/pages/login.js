import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { login } from "../services/api";

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
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

// Validation schema
const LoginSchema = Yup.object().shape({
  username: Yup.string().required("Tên đăng nhập không được để trống"),
  password: Yup.string().required("Mật khẩu không được để trống"),
});

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setError("");

    try {
      const response = await login(values.username, values.password);
      
      if (response.data.token) {
        localStorage.setItem("userToken", response.data.token);
        router.push("/dashboard");
      } else {
        setError("Đăng nhập thất bại. Máy chủ không phản hồi hợp lệ.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
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
            <LockOutlinedIcon />
          </Box>
          <Typography component="h1" variant="h5">
            Đăng nhập
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Hoặc{" "}
            <Link href="/register" style={{ color: "primary.main" }}>
              tạo tài khoản mới
            </Link>
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <Formik
          initialValues={{ username: "", password: "" }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
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

              <Field name="password">
                {({ field, meta }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    fullWidth
                    label="Mật khẩu"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
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

              <Box sx={{ textAlign: "right", mt: 1, mb: 2 }}>
                <Link href="/forgot-password" style={{ color: "primary.main" }}>
                  Quên mật khẩu?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{ mt: 2, mb: 2, py: 1.5 }}
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
    </Container>
  );
}

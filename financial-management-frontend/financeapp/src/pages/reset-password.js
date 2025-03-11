import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { confirmPasswordReset } from '../services/api';

// Material UI imports
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Mật khẩu không được để trống'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Mật khẩu xác nhận không khớp')
    .required('Xác nhận mật khẩu không được để trống'),
});

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
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

  useEffect(() => {
    if (!token && router.isReady) {
      setMessage('Mã đặt lại mật khẩu không hợp lệ hoặc bị thiếu. Vui lòng yêu cầu liên kết đặt lại mật khẩu mới.');
      setIsSuccess(false);
    }
  }, [token, router.isReady]);

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!token) {
      setMessage('Mã đặt lại mật khẩu không hợp lệ hoặc bị thiếu. Vui lòng yêu cầu liên kết đặt lại mật khẩu mới.');
      setIsSuccess(false);
      setSubmitting(false);
      return;
    }
    
    setMessage('');
    
    try {
      await confirmPasswordReset(token, values.password);
      setIsSuccess(true);
      setMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
    } catch (error) {
      setIsSuccess(false);
      // Ensure we're not trying to render an object directly
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || JSON.stringify(error.response.data))
        : 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn hoặc không hợp lệ.';
      setMessage(errorMessage);
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              p: 1,
              mb: 1,
              color: 'white',
            }}
          >
            <LockOutlinedIcon />
          </Box>
          <Typography component="h1" variant="h5">
            Đặt lại mật khẩu
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Nhập mật khẩu mới của bạn
          </Typography>
        </Box>

        {message && (
          <Alert severity={isSuccess ? 'success' : 'error'} sx={{ width: '100%', mb: 2 }}>
            {message}
          </Alert>
        )}

        {!isSuccess && token && (
          <Formik
            initialValues={{ password: '', confirmPassword: '' }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ width: '100%' }}>
                <Field name="password">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      label="Mật khẩu mới"
                      type={showPassword ? 'text' : 'password'}
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
                      label="Xác nhận mật khẩu mới"
                      type={showConfirmPassword ? 'text' : 'password'}
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
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </Button>
              </Form>
            )}
          </Formik>
        )}

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link href="/login" style={{ color: 'primary.main' }}>
            {isSuccess ? 'Đăng nhập với mật khẩu mới' : 'Quay lại trang đăng nhập'}
          </Link>
        </Box>
      </Paper>
    </Container>
  );
} 
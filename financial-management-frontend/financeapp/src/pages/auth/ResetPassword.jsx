import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { confirmPasswordReset } from '../../services/api';

// Material UI imports
import {
  Box,
  Button,
  CssBaseline,
  FormControl,
  FormLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
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

const Card = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const ResetPasswordContainer = styled(Stack)(({ theme }) => ({
  height: '100vh',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
  },
}));

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
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
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMessage('Mã đặt lại mật khẩu không hợp lệ hoặc bị thiếu. Vui lòng yêu cầu liên kết đặt lại mật khẩu mới.');
    }
  }, [location]);

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
    <CssBaseline>
      <ResetPasswordContainer direction="column" justifyContent="space-between">
        <Card elevation={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center' }}
            >
              Đặt lại mật khẩu
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Nhập mật khẩu mới của bạn
            </Typography>
          </Box>

          {message && (
            <Typography color={isSuccess ? 'success.main' : 'error'} sx={{ mt: 1, textAlign: 'center' }}>
              {message}
            </Typography>
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
                <Form>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <FormControl>
                      <FormLabel htmlFor="password">Mật khẩu mới</FormLabel>
                      <Field name="password">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="password"
                            placeholder="••••••"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            fullWidth
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
                    </FormControl>

                    <FormControl>
                      <FormLabel htmlFor="confirmPassword">Xác nhận mật khẩu mới</FormLabel>
                      <Field name="confirmPassword">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="confirmPassword"
                            placeholder="••••••"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            fullWidth
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
                    </FormControl>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ mt: 1 }}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
            >
              {isSuccess ? 'Đăng nhập với mật khẩu mới' : 'Quay lại trang đăng nhập'}
            </Link>
          </Box>
        </Card>
      </ResetPasswordContainer>
    </CssBaseline>
  );
} 
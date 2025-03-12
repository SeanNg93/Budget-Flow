import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { login } from '../../../config/axiosInstance';

// Material UI imports
import {
  Box,
  Button,
  Checkbox,
  Container,
  CssBaseline,
  Divider,
  FormControl,
  FormControlLabel,
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
import {Visibility, VisibilityOff, Google, Facebook, GitHub} from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AuthService from "@/services/auth.service";
import {GoogleOAuthProvider, useGoogleLogin} from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

// Validation schema
const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Tên đăng nhập không được để trống'),
  password: Yup.string().required('Mật khẩu không được để trống'),
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

const LoginContainer = styled(Stack)(({ theme }) => ({
  height: 'calc(100dvh)',
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

// Logo component
const SitemarkIcon = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: 2,
    }}
  >
    <Box
      sx={{
        backgroundColor: 'primary.main',
        borderRadius: '50%',
        p: 1,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LockOutlinedIcon />
    </Box>
  </Box>
);

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('userToken');
        if (token) {
          // Verify token validity
          const userData = localStorage.getItem('userData');
          if (userData) {
            // If token exists and we have user data, redirect to dashboard
            navigate('/dashboard');
          } else {
            // If token exists but no user data, clear token
            localStorage.removeItem('userToken');
          }
        }
      } catch (error) {
        // Clear any invalid tokens
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');

    try {
      // Try using the direct login function from axiosInstance
      const response = await login(values.username, values.password);
      
      // Check for token in the response - the backend returns it as 'token' in a JwtResponse
      if (response.data && (response.data.token || response.data.accessToken)) {
        // Store the token with the key 'userToken' to match what's used in axiosInstance.js
        const token = response.data.token || response.data.accessToken;
        localStorage.setItem('userToken', token);
        
        // Lấy thông tin cũ từ localStorage nếu có
        const oldUserData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        // Kết hợp thông tin từ response với thông tin cũ
        const userProfile = {
          ...oldUserData, // Giữ lại thông tin cũ
          id: response.data.id || oldUserData.id,
          username: values.username,
          email: response.data.email,
          fullName: response.data.fullName || values.username,
          joinDate: response.data.joinDate || oldUserData.joinDate || new Date().toISOString(),
          avatar: response.data.avatar || oldUserData.avatar || '/default-avatar.png',
          role: response.data.roles?.[0] || oldUserData.role || 'User',
          // Giữ lại thông tin phone và dateOfBirth từ dữ liệu cũ nếu có
          phone: response.data.phone || oldUserData.phone || '',
          dateOfBirth: response.data.dateOfBirth || oldUserData.dateOfBirth || '',
          bio: response.data.bio || oldUserData.bio || ''
        };
        
        localStorage.setItem('userData', JSON.stringify(userProfile));
        
        navigate('/dashboard');
      } else {
        setError('Login failed: No token received from server');
      }
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Login failed: ${error.response.data.message || error.response.statusText || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError('Login failed: No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Login failed: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessLoginGoogle = async (response) => {
    try {
      const userInfo = await AuthService.getUserInfoGoogle(response.access_token);
      
      // Here you would typically send this info to your backend to verify
      // and create a session or JWT token
      
      // For now, we'll just store the Google info and redirect
      localStorage.setItem('userToken', response.access_token);
      localStorage.setItem('userData', JSON.stringify({
        id: userInfo.sub,
        username: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      }));
      
      navigate('/dashboard');
    } catch (error) {
      setError('Google login failed. Please try again.');
    }
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: handleSuccessLoginGoogle,
    scope: "profile email",
  });

  return (
    <CssBaseline>
      <LoginContainer direction="column" justifyContent="space-between">
        <Card elevation={3}>
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center', mb: 2 }}
          >
            Đăng nhập
          </Typography>

          {error && (
            <Typography color="error" sx={{ mt: 1, textAlign: 'center', mb: 2 }}>
              {error}
            </Typography>
          )}

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
          >
            {({ errors, touched, isSubmitting, handleSubmit: formikSubmit }) => (
              <Form>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    gap: 2,
                  }}
                >
                  <FormControl>
                    <FormLabel htmlFor="username">Tên đăng nhập</FormLabel>
                    <Field name="username">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="username"
                          placeholder="Tên đăng nhập"
                          autoComplete="username"
                          autoFocus
                          fullWidth
                          variant="outlined"
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                        />
                      )}
                    </Field>
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="password">Mật khẩu</FormLabel>
                    <Field name="password">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="password"
                          placeholder="••••••"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          fullWidth
                          variant="outlined"
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

                  <FormControlLabel
                    control={<Checkbox value="remember" color="primary" />}
                    label="Ghi nhớ đăng nhập"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{ mt: 1 }}
                    onClick={() => {
                      formikSubmit();
                    }}
                  >
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>

                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{ alignSelf: 'center', mt: 1 }}
                  >
                    Quên mật khẩu?
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 2 }}>hoặc</Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  onClick={() => loginGoogle()}
              >
                Đăng nhập với Google
              </Button>


            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Facebook />}
              onClick={() => alert('Đăng nhập với Facebook')}
            >
              Đăng nhập với Facebook
            </Button>

            <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHub/>}
                onClick={() => window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23lik6g6WygAhPnsUc`}
            >
              Đăng nhập với Github
            </Button>
            
            <Typography sx={{ textAlign: 'center', mt: 1 }}>
              Chưa có tài khoản?{' '}
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Đăng ký
              </Link>
            </Typography>
          </Box>
        </Card>
      </LoginContainer>
    </CssBaseline>
  );
} 
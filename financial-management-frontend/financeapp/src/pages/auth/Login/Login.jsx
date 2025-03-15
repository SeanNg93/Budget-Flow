import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { login } from '../../../config/axiosInstance';
import AuthService from "@/services/auth.service";
import { useGoogleLogin } from "@react-oauth/google";
import styles from '../../../styles/auth.module.css';

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
import { Visibility, VisibilityOff, Google, Facebook, GitHub } from '@mui/icons-material';

// Validation schema
const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const Login = () => {
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
        
        // Also store basic user info if available
        if (response.data.username) {
          localStorage.setItem('userData', JSON.stringify({
            id: response.data.id,
            username: response.data.username,
            email: response.data.email,
            roles: response.data.roles || []
          }));
        }
        
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
      <Stack direction="column" justifyContent="space-between" className={styles.authContainer}>
        <Paper elevation={3} className={styles.authCard}>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center', mb: 2 }}
          >
            Login
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
                    <FormLabel htmlFor="username">Username</FormLabel>
                    <Field name="username">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="username"
                          placeholder="Username"
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
                    <FormLabel htmlFor="password">Password</FormLabel>
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
                    label="Remember me"
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
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Button>

                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{ alignSelf: 'center', mt: 1 }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 2 }}>or</Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  onClick={() => loginGoogle()}
              >
                Login with Google
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
                onClick={() => window.location.href = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`}
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
        </Paper>
      </Stack>
    </CssBaseline>
  );
};

export default Login;
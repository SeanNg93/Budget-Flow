import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { login } from '../../../config/axiosInstance';
import { createDefaultCategories } from '../../../services/FinanceService';
import styles from '../../../styles/auth.module.css';
import AuthError from '../../../components/AuthError';

// Material UI imports
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material';

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
        
        // Check if this is a new user that needs default categories
        const isNewUser = localStorage.getItem('newUser') === 'true';
        if (isNewUser) {
          try {
            // Now that the user is logged in, create default categories
            await createDefaultCategories();
            console.log('Default categories created successfully for new user');
            // Remove the new user flag
            localStorage.removeItem('newUser');
          } catch (categoryError) {
            console.error('Failed to create default categories:', categoryError);
            // Continue with login process even if category creation fails
          }
        }
        
        navigate('/dashboard');
      } else {
        setError('No token received from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Extract error message from response using simplified logic
      if (error.response && error.response.data) {
        // Use the message directly if available
        if (error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError('Authentication failed');
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(error.message || 'An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CssBaseline>
      <div className={styles.authContainer}>
        <Paper elevation={3} className={styles.authCard}>
          <Box className={styles.logoContainer}>
            <div className={styles.logoBackground}>
              <img src="/Dollarnote_siegel_hq.jpg" alt="Budget Flow Logo" className={styles.logo} />
            </div>
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            BUDGET FLOW
          </Typography>
          
          <Typography variant="body2" className={styles.appTagline}>
            Illuminate Your Financial Future
          </Typography>

          <AuthError message={error} visible={!!error} />

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
          >
            {({ errors, touched, isSubmitting, handleSubmit: formikSubmit }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1 }}>
                  <FormControl className={styles.formField}>
                    <FormLabel htmlFor="username" className={styles.formLabel}>Username</FormLabel>
                    <Field name="username">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="username"
                          placeholder="Type your username"
                          autoComplete="username"
                          autoFocus
                          fullWidth
                          variant="outlined"
                          size="small"
                          className={styles.inputField}
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person fontSize="small" sx={{ color: '#888' }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                  </FormControl>

                  <FormControl className={styles.formField}>
                    <FormLabel htmlFor="password" className={styles.formLabel}>Password</FormLabel>
                    <Field name="password">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="password"
                          placeholder="Type your password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          fullWidth
                          variant="outlined"
                          size="small"
                          className={styles.inputField}
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock fontSize="small" sx={{ color: '#888' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={handleClickShowPassword}
                                  onMouseDown={handleMouseDownPassword}
                                  edge="end"
                                  size="small"
                                >
                                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                  </FormControl>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <FormControlLabel
                      control={<Checkbox size="small" value="remember" color="primary" />}
                      label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Remember me</Typography>}
                    />
                    <Link
                      component={RouterLink}
                      to="/forgot-password"
                      variant="body2"
                      className={styles.authLink}
                    >
                      Forgot password?
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                    onClick={() => {
                      formikSubmit();
                    }}
                  >
                    {isSubmitting ? 'Logging in...' : 'LOGIN'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
          
          <Typography sx={{ textAlign: 'center', mt: 2, fontSize: '0.85rem' }}>
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/register"
              className={styles.authLink}
            >
              Sign up
            </Link>
          </Typography>
        </Paper>
      </div>
    </CssBaseline>
  );
};

export default Login;
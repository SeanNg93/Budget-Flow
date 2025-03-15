import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { confirmPasswordReset } from '../../config/axiosInstance';
import styles from '../../styles/auth.module.css';

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
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Confirm password is required'),
});

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
      setMessage('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [location]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage('');
    
    if (!token) {
      setMessage('Invalid or missing reset token. Please request a new password reset link.');
      setSubmitting(false);
      return;
    }
    
    try {
      const response = await confirmPasswordReset(token, values.password);
      setIsSuccess(true);
      setMessage(response.data.message || 'Password has been reset successfully! You can now log in with your new password.');
    } catch (error) {
      setIsSuccess(false);
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || JSON.stringify(error.response.data))
        : 'Failed to reset password. The link may have expired or is invalid.';
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CssBaseline>
      <Stack direction="column" justifyContent="space-between" className={styles.authContainer}>
        <Paper elevation={3} className={styles.authCard}>
          <Box className={styles.logoContainer}>
            <img src="/logo.png" alt="Budget Flow Logo" className={styles.logo} />
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            Reset Password
          </Typography>
          
          <Typography variant="body1" className={styles.appSubtitle}>
            Enter your new password
          </Typography>

          {message && (
            <Box className={isSuccess ? styles.successMessage : styles.errorMessage}>
              {message}
            </Box>
          )}

          {!isSuccess && token && (
            <Formik
              initialValues={{ password: '', confirmPassword: '' }}
              validationSchema={ResetPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, errors, touched }) => (
                <Form>
                  <FormControl fullWidth className={styles.formField}>
                    <FormLabel htmlFor="password" className={styles.formLabel}>
                      New Password
                    </FormLabel>
                    <Field
                      as={TextField}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      fullWidth
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
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
                  </FormControl>

                  <FormControl fullWidth className={styles.formField}>
                    <FormLabel htmlFor="confirmPassword" className={styles.formLabel}>
                      Confirm New Password
                    </FormLabel>
                    <Field
                      as={TextField}
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      variant="outlined"
                      fullWidth
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle confirm password visibility"
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
                  </FormControl>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                    startIcon={<LockOutlinedIcon />}
                  >
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </Form>
              )}
            </Formik>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              {isSuccess ? (
                <Link
                  component={RouterLink}
                  to="/login"
                  className={styles.authLink}
                >
                  Go to Login
                </Link>
              ) : (
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  className={styles.authLink}
                >
                  Request a new reset link
                </Link>
              )}
            </Typography>
          </Box>
        </Paper>
      </Stack>
    </CssBaseline>
  );
} 
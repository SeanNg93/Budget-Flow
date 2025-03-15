import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { resetPassword, verifyResetToken } from '../../config/axiosInstance';
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
  TextField,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';

// Validation schema
const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setMessage('Invalid or missing reset token');
        setIsLoading(false);
        return;
      }

      try {
        const response = await verifyResetToken(token);
        if (response.data && response.data.valid) {
          setIsTokenValid(true);
        } else {
          setMessage('This password reset link is invalid or has expired');
        }
      } catch (error) {
        setMessage('This password reset link is invalid or has expired');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage('');

    try {
      const response = await resetPassword(token, values.password);
      
      if (response.data) {
        setIsSuccess(true);
        setMessage('Your password has been successfully reset');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { message: 'Password reset successful. Please login with your new password.' } });
        }, 3000);
      }
    } catch (error) {
      setIsSuccess(false);
      if (error.response) {
        setMessage(`Failed to reset password: ${error.response.data.message || error.response.statusText || 'Server error'}`);
      } else if (error.request) {
        setMessage('Failed to reset password: No response from server. Please try again later.');
      } else {
        setMessage(`Failed to reset password: ${error.message}`);
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
              <img src="/Illuminati-Logo.png" alt="Budget Flow Logo" className={styles.logo} />
            </div>
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            BUDGET FLOW
          </Typography>
          
          <Typography variant="body2" className={styles.appTagline}>
            Illuminate Your Financial Future
          </Typography>

          {message && (
            <Box className={isSuccess ? styles.successMessage : styles.errorMessage}>
              {message}
            </Box>
          )}

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography>Verifying your reset link...</Typography>
            </Box>
          ) : isTokenValid ? (
            <Formik
              initialValues={{
                password: '',
                confirmPassword: '',
              }}
              validationSchema={ResetPasswordSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, handleSubmit: formikSubmit }) => (
                <Form>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1.5 }}>
                    <FormControl className={styles.formField}>
                      <FormLabel htmlFor="password" className={styles.formLabel}>New Password</FormLabel>
                      <Field name="password">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="password"
                            placeholder="Enter new password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
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

                    <FormControl className={styles.formField}>
                      <FormLabel htmlFor="confirmPassword" className={styles.formLabel}>Confirm New Password</FormLabel>
                      <Field name="confirmPassword">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
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
                                    onClick={handleClickShowConfirmPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                    size="small"
                                  >
                                    {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
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
                      className={styles.submitButton}
                      onClick={() => {
                        formikSubmit();
                      }}
                    >
                      {isSubmitting ? 'Resetting...' : 'RESET PASSWORD'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography>
                Please request a new password reset link from the{' '}
                <Link component={RouterLink} to="/forgot-password" className={styles.authLink}>
                  forgot password
                </Link>{' '}
                page.
              </Typography>
            </Box>
          )}

          <Typography sx={{ textAlign: 'center', mt: 2, fontSize: '0.85rem' }}>
            Remember your password?{' '}
            <Link
              component={RouterLink}
              to="/login"
              className={styles.authLink}
            >
              Back to login
            </Link>
          </Typography>
        </Paper>
      </div>
    </CssBaseline>
  );
};

export default ResetPassword; 
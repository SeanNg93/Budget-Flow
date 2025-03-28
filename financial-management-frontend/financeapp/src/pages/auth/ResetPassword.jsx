import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { resetPassword, verifyResetToken } from '../../config/axiosInstance';
import styles from '../../styles/auth.module.css';
import { useTranslation } from 'react-i18next';

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

// Validation schema with translation
const ResetPasswordSchema = (t) => Yup.object().shape({
  password: Yup.string()
    .min(6, t('auth.errors.passwordMin', 'Password must be at least 6 characters'))
    .required(t('auth.errors.passwordRequired', 'Password is required')),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], t('auth.errors.passwordMatch', 'Passwords must match'))
    .required(t('auth.errors.confirmPasswordRequired', 'Confirm password is required')),
});

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token: pathToken } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const queryToken = queryParams.get('token');
  
  // Use path parameter first, then query parameter
  const token = pathToken || queryToken;
  
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setMessage(t('auth.invalidOrMissingToken', 'Invalid or missing reset token'));
        setIsLoading(false);
        return;
      }

      try {
        const response = await verifyResetToken(token);
        if (response.data && response.data.valid) {
          setIsTokenValid(true);
        } else {
          setMessage(t('auth.invalidOrExpiredLink', 'This password reset link is invalid or has expired'));
        }
      } catch (error) {
        setMessage(t('auth.invalidOrExpiredLink', 'This password reset link is invalid or has expired'));
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [token, t]);

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
        setMessage(t('auth.passwordResetSuccess', 'Your password has been successfully reset'));
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { message: t('auth.resetSuccess', 'Password reset successful. Please login with your new password.') } });
        }, 3000);
      }
    } catch (error) {
      setIsSuccess(false);
      if (error.response) {
        setMessage(`${t('auth.resetFailedPrefix', 'Failed to reset password')}: ${error.response.data.message || error.response.statusText || t('auth.serverError', 'Server error')}`);
      } else if (error.request) {
        setMessage(t('auth.resetFailedNoResponse', 'Failed to reset password: No response from server. Please try again later.'));
      } else {
        setMessage(`${t('auth.resetFailedPrefix', 'Failed to reset password')}: ${error.message}`);
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
              <img src="/Dollarnote_siegel_hq.jpg" alt={t('common.appName', 'Budget Flow Logo')} className={styles.logo} />
            </div>
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            {t('common.appName', 'BUDGET FLOW')}
          </Typography>
          
          <Typography variant="body2" className={styles.appTagline}>
            {t('auth.appTagline', 'Illuminate Your Financial Future')}
          </Typography>

          {message && (
            <Box className={isSuccess ? styles.successMessage : styles.errorMessage}>
              {message}
            </Box>
          )}

          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography>{t('auth.verifyingResetLink', 'Verifying your reset link...')}</Typography>
            </Box>
          ) : isTokenValid ? (
            <Formik
              initialValues={{
                password: '',
                confirmPassword: '',
              }}
              validationSchema={ResetPasswordSchema(t)}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, handleSubmit: formikSubmit }) => (
                <Form>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1.5 }}>
                    <FormControl className={styles.formField}>
                      <FormLabel htmlFor="password" className={styles.formLabel}>{t('auth.newPassword', 'New Password')}</FormLabel>
                      <Field name="password">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="password"
                            placeholder={t('auth.enterNewPassword', 'Enter new password')}
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
                      <FormLabel htmlFor="confirmPassword" className={styles.formLabel}>{t('auth.confirmPassword', 'Confirm New Password')}</FormLabel>
                      <Field name="confirmPassword">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="confirmPassword"
                            placeholder={t('auth.confirmNewPassword', 'Confirm new password')}
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
                      {isSubmitting ? t('auth.resetting', 'Resetting...') : t('auth.resetPassword', 'RESET PASSWORD')}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ textAlign: 'center', fontWeight: 500 }}>
                  {message}
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to="/forgot-password"
                variant="contained"
                color="primary"
              >
                {t('auth.requestNewLink', 'Request a new reset link')}
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                sx={{ mt: 2 }}
              >
                {t('auth.backToLogin', 'Back to login')}
              </Button>
            </Box>
          )}
        </Paper>
      </div>
    </CssBaseline>
  );
};

export default ResetPassword; 
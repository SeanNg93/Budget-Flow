import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { register } from '../../config/axiosInstance';
import { useTranslation } from 'react-i18next';
import styles from '../../styles/auth.module.css';
import emailjs from '../../config/emailjs';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';
import AuthError from '../../components/AuthError';
import AuthSuccess from '../../components/AuthSuccess';
import axiosInstance from '../../config/axiosInstance';

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
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Person, Email, Lock, CheckCircle, Error } from '@mui/icons-material';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'available', 'taken'
  const [usernameTimeout, setUsernameTimeout] = useState(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // null, 'available', 'taken'
  const [emailTimeout, setEmailTimeout] = useState(null);

  // Validation schema
  const RegisterSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, t('auth.errors.usernameMin', 'Username must be at least 3 characters'))
      .max(20, t('auth.errors.usernameMax', 'Username must be less than 20 characters'))
      .required(t('auth.errors.usernameRequired', 'Username is required')),
    email: Yup.string()
      .email(t('auth.errors.emailInvalid', 'Invalid email address'))
      .required(t('auth.errors.emailRequired', 'Email is required')),
    password: Yup.string()
      .min(6, t('auth.errors.passwordMin', 'Password must be at least 6 characters'))
      .required(t('auth.errors.passwordRequired', 'Password is required')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], t('auth.errors.passwordMatch', 'Passwords must match'))
      .required(t('auth.errors.confirmPasswordRequired', 'Confirm password is required')),
    terms: Yup.boolean()
      .oneOf([true], t('auth.errors.termsRequired', 'You must accept the terms and conditions'))
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Check if username is already taken
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) return;
    
    setIsCheckingUsername(true);
    setUsernameStatus(null);
    
    try {
      // Use a simple get request to check if user exists
      const response = await axiosInstance.get(`/auth/check-username?username=${username}`);
      
      if (response.data && response.data.available) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
      }
    } catch (error) {
      // If endpoint doesn't exist or error occurs, assume username is ok
      // This is a fallback since we'll check again during registration
      setUsernameStatus(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Handle username field change with debounce
  const handleUsernameChange = (e, formikChange) => {
    const username = e.target.value;
    
    // Clear any previous timeout
    if (usernameTimeout) {
      clearTimeout(usernameTimeout);
    }
    
    // Call the original Formik onChange
    formikChange(e);
    
    // Don't check if too short
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }
    
    // Set a new timeout to check username availability after 500ms of user stopping typing
    const timeoutId = setTimeout(() => {
      // Call the function without await here
      checkUsernameAvailability(username);
    }, 500);
    
    setUsernameTimeout(timeoutId);
  };

  // Add email checking function
  const checkEmailAvailability = async (email) => {
    if (!email || !email.includes('@')) return;
    
    setIsCheckingEmail(true);
    setEmailStatus(null);
    
    try {
      const response = await axiosInstance.get(`/auth/check-email?email=${email}`);
      
      if (response.data && response.data.available) {
        setEmailStatus('available');
      } else {
        setEmailStatus('taken');
      }
    } catch (error) {
      // If endpoint doesn't exist or error occurs, assume email is ok
      setEmailStatus(null);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Add email change handler with debounce
  const handleEmailChange = (e, formikChange) => {
    const email = e.target.value;
    
    // Clear any previous timeout
    if (emailTimeout) {
      clearTimeout(emailTimeout);
    }
    
    // Call the original Formik onChange
    formikChange(e);
    
    // Don't check if invalid email
    if (!email || !email.includes('@')) {
      setEmailStatus(null);
      return;
    }
    
    // Set a new timeout to check email availability after typing stops
    const timeoutId = setTimeout(() => {
      // Call the function without await here
      checkEmailAvailability(email);
    }, 500);
    
    setEmailTimeout(timeoutId);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');
    setSuccess('');

    // If username is taken, prevent submission
    if (usernameStatus === 'taken') {
      setError(t('auth.errors.usernameTaken', 'Username is already taken. Please choose a different username.'));
      setSubmitting(false);
      return;
    }
    
    // If email is taken, prevent submission
    if (emailStatus === 'taken') {
      setError(t('auth.errors.emailTaken', 'Email address is already registered. Please use a different email or try to login.'));
      setSubmitting(false);
      return;
    }

    try {
      // Call the register function from axiosInstance
      const response = await register(values.username, values.email, values.password);
      
      // Check for success response
      if (response.data && response.data.success === "true") {
        // If we have an activation link, send email
        if (response.data.activationLink) {
          // Try to send activation email
          try {
            await emailjs.send(
              EMAILJS_CONFIG.serviceId,
              EMAILJS_CONFIG.activationTemplateId,
              {
                to_email: values.email,
                to_name: values.username,
                activation_link: response.data.activationLink
              }
            );
            setSuccess(t('auth.activationEmailSent', 'Registration successful! We have sent an activation link to your email. Please check your inbox and spam folder.'));
          } catch (emailError) {
            console.error('Failed to send activation email:', emailError);
            // Redirect to login page if email fails
            navigate('/login', { state: { message: t('auth.checkEmailForActivation', 'Registration successful! Please check your email for activation instructions.') } });
          }
        } else {
          // No activation link in response
          setSuccess(t('auth.registrationSuccessNoLink', 'Registration successful! Please check your email for activation instructions or contact support.'));
        }
      } else {
        // Redirect to login page with success message if no specific success data
        navigate('/login', { state: { message: t('auth.registrationSuccessGeneral', 'Registration successful! Please login.') } });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Extract error message from response using improved logic for username errors
      if (error.response && error.response.data) {
        // Check specifically for username already exists error
        if (error.response.data.message && error.response.data.message.includes('Username already exists')) {
          setError(t('auth.errors.usernameTaken', 'Username is already taken. Please choose a different username.'));
          setUsernameStatus('taken');
        }
        // Check for email already exists error
        else if (error.response.data.message && error.response.data.message.includes('Email already exists')) {
          setError(t('auth.errors.emailTaken', 'Email address is already registered. Please use a different email or try to login.'));
        }
        // Use the message directly if available
        else if (error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(t('auth.errors.registrationFailed', 'Registration failed'));
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError(t('auth.errors.noResponse', 'No response from server. Please try again later.'));
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(error.message || t('auth.errors.unexpected', 'An unexpected error occurred'));
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
              <img src="/Dollarnote_siegel_hq.jpg" alt={t('common.appName')} className={styles.logo} />
            </div>
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            {t('common.appName', 'BUDGET FLOW')}
          </Typography>
          
          <Typography variant="body2" className={styles.appTagline}>
            {t('auth.appTagline', 'Illuminate Your Financial Future')}
          </Typography>

          <AuthError message={error} visible={!!error} />
          <AuthSuccess message={success} visible={!!success} />

          <Formik
            initialValues={{
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
              terms: false
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, isSubmitting, handleChange: formikHandleChange }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1.5 }}>
                  {/* Username field */}
                  <FormControl className={styles.formField}>
                    <FormLabel htmlFor="username" className={styles.formLabel}>
                      {t('auth.username', 'Username')}
                    </FormLabel>
                    <Field name="username">
                      {({ field, meta, form }) => (
                        <TextField
                          {...field}
                          id="username"
                          placeholder={t('auth.placeholders.username', 'Choose a username')}
                          autoComplete="username"
                          autoFocus
                          fullWidth
                          variant="outlined"
                          size="small"
                          className={styles.inputField}
                          error={meta.touched && (Boolean(meta.error) || usernameStatus === 'taken')}
                          helperText={
                            meta.touched && meta.error ? meta.error :
                            usernameStatus === 'taken' ? t('auth.errors.usernameTaken', 'Username is already taken') :
                            usernameStatus === 'available' ? t('auth.usernameAvailable', 'Username is available') : ''
                          }
                          onChange={(e) => handleUsernameChange(e, field.onChange)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person fontSize="small" sx={{ color: '#888' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                {isCheckingUsername && <CircularProgress size={16} />}
                                {!isCheckingUsername && usernameStatus === 'available' && (
                                  <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                                )}
                                {!isCheckingUsername && usernameStatus === 'taken' && (
                                  <Error fontSize="small" sx={{ color: 'error.main' }} />
                                )}
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                  </FormControl>

                  {/* Email field */}
                  <FormControl className={styles.formField}>
                    <FormLabel htmlFor="email" className={styles.formLabel}>
                      {t('auth.email', 'Email')}
                    </FormLabel>
                    <Field name="email">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="email"
                          placeholder={t('auth.placeholders.email', 'Enter your email address')}
                          autoComplete="email"
                          fullWidth
                          variant="outlined"
                          size="small"
                          className={styles.inputField}
                          error={meta.touched && (Boolean(meta.error) || emailStatus === 'taken')}
                          helperText={
                            meta.touched && meta.error ? meta.error :
                            emailStatus === 'taken' ? t('auth.errors.emailTaken', 'Email address is already registered') :
                            emailStatus === 'available' ? t('auth.emailAvailable', 'Email is available') : ''
                          }
                          onChange={(e) => handleEmailChange(e, field.onChange)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Email fontSize="small" sx={{ color: '#888' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                {isCheckingEmail && <CircularProgress size={16} />}
                                {!isCheckingEmail && emailStatus === 'available' && (
                                  <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />
                                )}
                                {!isCheckingEmail && emailStatus === 'taken' && (
                                  <Error fontSize="small" sx={{ color: 'error.main' }} />
                                )}
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    </Field>
                  </FormControl>

                  {/* Password field */}
                  <FormControl className={styles.formField}>
                    <FormLabel htmlFor="password" className={styles.formLabel}>
                      {t('auth.password', 'Password')}
                    </FormLabel>
                    <Field name="password">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="password"
                          placeholder={t('auth.placeholders.password', 'Create a password')}
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

                  {/* Confirm Password field */}
                  <FormControl className={styles.formField}>
                    <FormLabel htmlFor="confirmPassword" className={styles.formLabel}>
                      {t('auth.confirmPassword', 'Confirm Password')}
                    </FormLabel>
                    <Field name="confirmPassword">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="confirmPassword"
                          placeholder={t('auth.placeholders.confirmPassword', 'Confirm your password')}
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
                                  aria-label="toggle confirm password visibility"
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

                  {/* Terms & Conditions checkbox */}
                  <FormControl className={styles.formField}>
                    <Field name="terms">
                      {({ field, meta }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              {...field}
                              size="small"
                              color="primary"
                              checked={field.value}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                              {t('auth.agreeToTerms', 'I agree to the')} {' '}
                              <Link href="#" underline="hover" className={styles.termsLink}>
                                {t('auth.termsAndConditions', 'Terms and Conditions')}
                              </Link>
                            </Typography>
                          }
                          className={styles.termsCheckbox}
                        />
                      )}
                    </Field>
                    {errors.terms && touched.terms && (
                      <Typography variant="caption" color="error">
                        {errors.terms}
                      </Typography>
                    )}
                  </FormControl>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        {t('auth.registering', 'Registering...')}
                      </>
                    ) : (
                      t('auth.register', 'REGISTER')
                    )}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

          <Typography sx={{ textAlign: 'center', mt: 2, fontSize: '0.85rem' }}>
            {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
            <Link
              component={RouterLink}
              to="/login"
              className={styles.authLink}
            >
              {t('auth.login', 'Login')}
            </Link>
          </Typography>
        </Paper>
      </div>
    </CssBaseline>
  );
};

export default Register; 
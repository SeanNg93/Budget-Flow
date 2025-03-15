import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { register as registerUser } from '../../config/axiosInstance';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';
import styles from '../../styles/auth.module.css';

// Material UI imports
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
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
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// Validation schema
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username cannot exceed 20 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords do not match')
    .required('Confirm password is required'),
});

export default function Register() {
  const navigate = useNavigate();
  const activationFormRef = useRef();
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [activationData, setActivationData] = useState(null);
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

  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage('');
    
    try {
      const response = await registerUser(values.username, values.email, values.password);
      setIsSuccess(true);
      
      // If the response contains an activation link, prepare to send an email
      if (response.data && response.data.activationLink) {
        setMessage('Registration successful! Preparing to send activation email...');
        setActivationData({
          to_email: values.email,
          activation_link: response.data.activationLink,
          user_name: values.username
        });
      } else {
        setMessage(response.data.message || 'Registration successful! Please check your email for activation instructions.');
      }
    } catch (error) {
      setIsSuccess(false);
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || JSON.stringify(error.response.data))
        : 'Registration failed. Please try again.';
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const sendActivationEmail = async () => {
    if (!activationData) return;
    
    setIsSendingEmail(true);
    
    try {
      const result = await sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.activationTemplateId,
        activationFormRef.current,
        EMAILJS_CONFIG.publicKey
      );
      
      setMessage('Registration successful! Please check your email for activation instructions.');
    } catch (error) {
      console.error('Failed to send activation email:', error);
      setMessage('Registration successful, but we could not send the activation email. Please contact support.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Send activation email when activation data is available
  useEffect(() => {
    if (activationData && !isSendingEmail) {
      sendActivationEmail();
    }
  }, [activationData]);

  return (
    <CssBaseline>
      <Stack direction="column" justifyContent="space-between" className={styles.authContainer}>
        <Paper elevation={3} className={styles.authCard}>
          <Box className={styles.logoContainer}>
            <img src="/logo.png" alt="Budget Flow Logo" className={styles.logo} />
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            Create Account
          </Typography>
          
          <Typography variant="body1" className={styles.appSubtitle}>
            Sign up to start managing your finances
          </Typography>

          {message && (
            <Box className={isSuccess ? styles.successMessage : styles.errorMessage}>
              {message}
            </Box>
          )}

          <Formik
            initialValues={{
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
              agreeTerms: false,
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, handleChange, values }) => (
              <Form>
                <FormControl fullWidth className={styles.formField}>
                  <FormLabel htmlFor="username" className={styles.formLabel}>
                    Username
                  </FormLabel>
                  <Field
                    as={TextField}
                    id="username"
                    name="username"
                    variant="outlined"
                    fullWidth
                    error={touched.username && Boolean(errors.username)}
                    helperText={touched.username && errors.username}
                  />
                </FormControl>

                <FormControl fullWidth className={styles.formField}>
                  <FormLabel htmlFor="email" className={styles.formLabel}>
                    Email
                  </FormLabel>
                  <Field
                    as={TextField}
                    id="email"
                    name="email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </FormControl>

                <FormControl fullWidth className={styles.formField}>
                  <FormLabel htmlFor="password" className={styles.formLabel}>
                    Password
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
                    Confirm Password
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

                <FormControlLabel
                  control={
                    <Checkbox
                      name="agreeTerms"
                      color="primary"
                      onChange={handleChange}
                      checked={values.agreeTerms}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link href="#" className={styles.authLink}>
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="#" className={styles.authLink}>
                        Privacy Policy
                      </Link>
                    </Typography>
                  }
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || isSendingEmail || !values.agreeTerms}
                  className={styles.submitButton}
                  startIcon={isSubmitting || isSendingEmail ? <CircularProgress size={20} /> : <PersonAddIcon />}
                >
                  {isSubmitting ? 'Registering...' : isSendingEmail ? 'Sending activation email...' : 'Create Account'}
                </Button>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2">
                    Already have an account?{' '}
                    <Link
                      component={RouterLink}
                      to="/login"
                      className={styles.authLink}
                    >
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </Form>
            )}
          </Formik>

          {/* Hidden form for EmailJS */}
          <form ref={activationFormRef} style={{ display: 'none' }}>
            <input type="text" name="to_email" value={activationData?.to_email || ''} readOnly />
            <input type="text" name="activation_link" value={activationData?.activation_link || ''} readOnly />
            <input type="text" name="user_name" value={activationData?.user_name || ''} readOnly />
          </form>
        </Paper>
      </Stack>
    </CssBaseline>
  );
} 
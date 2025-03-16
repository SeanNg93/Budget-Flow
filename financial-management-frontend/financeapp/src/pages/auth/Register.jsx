import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { register } from '../../config/axiosInstance';
import styles from '../../styles/auth.module.css';
import emailjs from '../../config/emailjs';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';

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
import { Visibility, VisibilityOff, Person, Email, Lock } from '@mui/icons-material';

// Validation schema
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  terms: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions')
});

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setError('');
    setSuccess('');

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
            setSuccess('Registration successful! We have sent an activation link to your email. Please check your inbox and spam folder.');
          } catch (emailError) {
            console.error('Failed to send activation email:', emailError);
            // Redirect to login page if email fails
            navigate('/login', { state: { message: 'Registration successful! Please check your email for activation instructions.' } });
          }
        } else {
          // No activation link in response
          setSuccess('Registration successful! Please check your email for activation instructions or contact support.');
        }
      } else {
        // Redirect to login page with success message if no specific success data
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      }
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Registration failed: ${error.response.data.message || error.response.statusText || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError('Registration failed: No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Registration failed: ${error.message}`);
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

          {error && (
            <Box className={styles.errorMessage}>
              {error}
            </Box>
          )}

          {success && (
            <Box className={styles.successMessage}>
              {success}
            </Box>
          )}

          {!success && (
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
              {({ errors, touched, isSubmitting, handleSubmit: formikSubmit }) => (
                <Form>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1.5 }}>
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
                      <FormLabel htmlFor="email" className={styles.formLabel}>Email</FormLabel>
                      <Field name="email">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="email"
                            placeholder="Type your email"
                            autoComplete="email"
                            fullWidth
                            variant="outlined"
                            size="small"
                            className={styles.inputField}
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Email fontSize="small" sx={{ color: '#888' }} />
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
                      <FormLabel htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</FormLabel>
                      <Field name="confirmPassword">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="confirmPassword"
                            placeholder="Confirm your password"
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

                    <FormControl className={styles.formField}>
                      <Field name="terms">
                        {({ field, meta }) => (
                          <FormControlLabel
                            control={
                              <Checkbox
                                {...field}
                                size="small"
                                color="primary"
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                I agree to the{' '}
                                <Link component={RouterLink} to="/terms" className={styles.authLink}>
                                  Terms and Conditions
                                </Link>
                              </Typography>
                            }
                            className={styles.checkboxLabel}
                          />
                        )}
                      </Field>
                      {errors.terms && touched.terms && (
                        <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
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
                      onClick={() => {
                        formikSubmit();
                      }}
                    >
                      {isSubmitting ? 'Creating Account...' : 'SIGN UP'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          )}

          {success && (
            <Button
              component={RouterLink}
              to="/login"
              fullWidth
              variant="contained"
              className={styles.gradientButton}
            >
              Go to Login
            </Button>
          )}

          <Typography sx={{ textAlign: 'center', mt: 2, fontSize: '0.85rem' }}>
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              className={styles.authLink}
            >
              Sign in
            </Link>
          </Typography>
        </Paper>
      </div>
    </CssBaseline>
  );
};

export default Register; 
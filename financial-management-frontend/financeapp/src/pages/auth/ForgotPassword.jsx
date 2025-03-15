import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { requestPasswordReset } from '../../config/axiosInstance';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';
import styles from '../../styles/auth.module.css';

// Material UI imports
import {
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Divider,
  FormControl,
  FormLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const resetFormRef = useRef();
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [resetData, setResetData] = useState(null);
  
  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage('');
    
    try {
      const response = await requestPasswordReset(values.email);
      setIsSuccess(true);
      
      // If the response contains a reset link, prepare to send an email
      if (response.data && response.data.resetLink) {
        setMessage('Password reset request received! Preparing to send email...');
        setResetData({
          to_email: values.email,
          reset_link: response.data.resetLink
        });
      } else {
        setMessage(response.data.message || 'Password reset instructions have been sent to your email.');
      }
    } catch (error) {
      setIsSuccess(false);
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || JSON.stringify(error.response.data))
        : 'Failed to request password reset. Please try again.';
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const sendResetEmail = async () => {
    if (!resetData) return;
    
    setIsSendingEmail(true);
    
    try {
      const result = await sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.resetTemplateId,
        resetFormRef.current,
        EMAILJS_CONFIG.publicKey
      );
      
      setMessage('Password reset instructions have been sent to your email.');
    } catch (error) {
      console.error('Failed to send reset email:', error);
      setMessage('Password reset request received, but we could not send the email. Please contact support.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Send reset email when reset data is available
  useEffect(() => {
    if (resetData && !isSendingEmail) {
      sendResetEmail();
    }
  }, [resetData]);

  return (
    <CssBaseline>
      <Stack direction="column" justifyContent="space-between" className={styles.authContainer}>
        <Paper elevation={3} className={styles.authCard}>
          <Box className={styles.logoContainer}>
            <img src="/logo.png" alt="Budget Flow Logo" className={styles.logo} />
          </Box>
          
          <Typography variant="h4" component="h1" className={styles.appTitle}>
            Forgot Password
          </Typography>
          
          <Typography variant="body1" className={styles.appSubtitle}>
            Enter your email to reset your password
          </Typography>

          {message && (
            <Box className={isSuccess ? styles.successMessage : styles.errorMessage}>
              {message}
            </Box>
          )}

          <Formik
            initialValues={{ email: '' }}
            validationSchema={ForgotPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
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

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || isSendingEmail}
                  className={styles.submitButton}
                  startIcon={isSubmitting || isSendingEmail ? <CircularProgress size={20} /> : <LockResetIcon />}
                >
                  {isSubmitting ? 'Processing...' : isSendingEmail ? 'Sending email...' : 'Reset Password'}
                </Button>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2">
                    Remember your password?{' '}
                    <Link
                      component={RouterLink}
                      to="/login"
                      className={styles.authLink}
                    >
                      Back to login
                    </Link>
                  </Typography>
                </Box>
              </Form>
            )}
          </Formik>

          {/* Hidden form for EmailJS */}
          <form ref={resetFormRef} style={{ display: 'none' }}>
            <input type="text" name="to_email" value={resetData?.to_email || ''} readOnly />
            <input type="text" name="reset_link" value={resetData?.reset_link || ''} readOnly />
          </form>
        </Paper>
      </Stack>
    </CssBaseline>
  );
} 
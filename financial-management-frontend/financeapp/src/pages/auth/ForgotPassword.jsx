import React, { useState, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';
import { requestPasswordReset } from '../../config/axiosInstance';
import styles from '../../styles/auth.module.css';

// Material UI imports
import {
  Box,
  Button,
  CssBaseline,
  FormControl,
  FormLabel,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { LockResetOutlined as LockResetIcon, Email as EmailIcon } from '@mui/icons-material';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef();

  const handleSubmit = async (values, { resetForm }) => {
    setIsSubmitting(true);
    setMessage('');

    try {
      // Request password reset from backend API
      const response = await requestPasswordReset(values.email);
      
      if (response.data && response.data.success === "true") {
        // If we have a resetLink, send an email using EmailJS
        if (response.data.resetLink) {
          try {
            // Set the form values for EmailJS
            formRef.current.reset_link.value = response.data.resetLink;
            formRef.current.to_email.value = values.email;
            
            // Send the email using EmailJS
            const emailResult = await sendForm(
              EMAILJS_CONFIG.serviceId,
              EMAILJS_CONFIG.resetPasswordTemplateId,
              formRef.current,
              EMAILJS_CONFIG.publicKey
            );
            
            if (emailResult.status === 200) {
              setIsSuccess(true);
              setMessage('Password reset instructions have been sent to your email.');
              resetForm();
            } else {
              throw new Error('Failed to send email');
            }
          } catch (emailError) {
            console.error('Error sending reset email:', emailError);
            // Still show success since the backend created the token
            setIsSuccess(true);
            setMessage('Password reset has been initiated. You should receive an email shortly.');
            resetForm();
          }
        } else {
          // No reset link in response
          setIsSuccess(true);
          setMessage(response.data.message || 'Password reset instructions have been sent to your email.');
          resetForm();
        }
      } else {
        throw new Error(response.data?.message || 'Failed to initiate password reset');
      }
    } catch (error) {
      setIsSuccess(false);
      if (error.response && error.response.data) {
        setMessage(error.response.data.message || 'Failed to send reset instructions. Please try again later.');
      } else {
        setMessage('Failed to send reset instructions. Please try again later.');
      }
      console.error('Error initiating password reset:', error);
    } finally {
      setIsSubmitting(false);
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

          {message && (
            <Box className={isSuccess ? styles.successMessage : styles.errorMessage}>
              {message}
            </Box>
          )}

          <Typography variant="body2" sx={{ textAlign: 'center', mb: 2, fontSize: '0.9rem' }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>

          <Formik
            initialValues={{ email: '' }}
            validationSchema={ForgotPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, handleSubmit: formikSubmit }) => (
              <Form>
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 1.5 }}>
                  <FormControl className={styles.formField}>
                    <FormLabel htmlFor="email" className={styles.formLabel}>Email</FormLabel>
                    <Field name="email">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="email"
                          placeholder="Enter your email address"
                          autoComplete="email"
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
                                <EmailIcon fontSize="small" sx={{ color: '#888' }} />
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
                    startIcon={<LockResetIcon fontSize="small" />}
                  >
                    {isSubmitting ? 'Sending...' : 'RESET PASSWORD'}
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>

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

          {/* Hidden form for EmailJS */}
          <form ref={formRef} style={{ display: 'none' }}>
            <input type="text" name="to_email" />
            <input type="text" name="reset_link" />
          </form>
        </Paper>
      </div>
    </CssBaseline>
  );
};

export default ForgotPassword; 
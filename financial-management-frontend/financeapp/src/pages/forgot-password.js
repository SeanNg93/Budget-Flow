import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { requestPasswordReset } from '../services/api';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs.config';

// Material UI imports
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Email không được để trống'),
});

export default function ForgotPassword() {
  const router = useRouter();
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
        setMessage('Yêu cầu đặt lại mật khẩu đã được ghi nhận! Đang chuẩn bị gửi email...');
        setResetData({
          to_email: values.email,
          reset_link: response.data.resetLink
        });
      } else {
        setMessage(response.data.message || 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.');
      }
    } catch (error) {
      setIsSuccess(false);
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || JSON.stringify(error.response.data))
        : 'Không thể yêu cầu đặt lại mật khẩu. Vui lòng thử lại.';
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
        EMAILJS_CONFIG.resetPasswordTemplateId,
        resetFormRef.current,
        EMAILJS_CONFIG.publicKey
      );
      
      if (result.status === 200) {
        setMessage(`Email hướng dẫn đặt lại mật khẩu đã được gửi đến ${resetData.to_email}`);
      } else {
        setMessage('Không thể gửi email đặt lại mật khẩu. Vui lòng liên hệ quản trị viên.');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      setMessage('Không thể gửi email đặt lại mật khẩu. Vui lòng liên hệ quản trị viên.');
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  // Send reset email when data is available
  useEffect(() => {
    if (resetData) {
      sendResetEmail();
    }
  }, [resetData]);
  
  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              p: 1,
              mb: 1,
              color: 'white',
            }}
          >
            <LockResetIcon />
          </Box>
          <Typography component="h1" variant="h5">
            Quên mật khẩu
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Nhập email của bạn để nhận liên kết đặt lại mật khẩu
          </Typography>
        </Box>

        {message && (
          <Alert severity={isSuccess ? 'success' : 'error'} sx={{ width: '100%', mb: 2 }}>
            {message}
          </Alert>
        )}

        {isSendingEmail && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>Đang gửi email đặt lại mật khẩu...</Typography>
          </Box>
        )}

        {!isSuccess && (
          <Formik
            initialValues={{ email: '' }}
            validationSchema={ForgotPasswordSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ width: '100%' }}>
                <Field name="email">
                  {({ field, meta }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      fullWidth
                      id="email"
                      label="Email"
                      autoComplete="email"
                      autoFocus
                      error={meta.touched && Boolean(meta.error)}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt lại mật khẩu'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Link href="/login" style={{ color: 'primary.main' }}>
                    Quay lại trang đăng nhập
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        )}

        {isSuccess && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link href="/login" style={{ color: 'primary.main' }}>
              Quay lại trang đăng nhập
            </Link>
          </Box>
        )}

        {/* Hidden form for EmailJS */}
        <form ref={resetFormRef} style={{ display: 'none' }}>
          <input type="text" name="to_email" defaultValue={resetData?.to_email || ''} />
          <input type="text" name="reset_link" defaultValue={resetData?.reset_link || ''} />
        </form>
      </Paper>
    </Container>
  );
} 
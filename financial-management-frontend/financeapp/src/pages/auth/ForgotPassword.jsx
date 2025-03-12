import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { requestPasswordReset } from '../../config/axiosInstance';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';

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
import { styled } from '@mui/material/styles';
import LockResetIcon from '@mui/icons-material/LockReset';

// Validation schema
const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Email không hợp lệ')
    .required('Email không được để trống'),
});

const Card = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
}));

const ForgotPasswordContainer = styled(Stack)(({ theme }) => ({
  height: '100vh',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
  },
}));

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
    <CssBaseline>
      <ForgotPasswordContainer direction="column" justifyContent="space-between">
        <Card elevation={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center' }}
            >
              Quên mật khẩu
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              Nhập email của bạn để nhận liên kết đặt lại mật khẩu
            </Typography>
          </Box>

          {message && (
            <Typography color={isSuccess ? 'success.main' : 'error'} sx={{ mt: 1, textAlign: 'center' }}>
              {message}
            </Typography>
          )}

          {isSendingEmail && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography>Đang gửi email đặt lại mật khẩu...</Typography>
            </Box>
          )}

          {!isSuccess && (
            <Formik
              initialValues={{ email: '' }}
              validationSchema={ForgotPasswordSchema}
              onSubmit={handleSubmit}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <FormControl>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <Field name="email">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="email"
                            placeholder="your@email.com"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            fullWidth
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                          />
                        )}
                      </Field>
                    </FormControl>

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ mt: 1 }}
                    >
                      {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt lại mật khẩu'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              component={RouterLink}
              to="/login"
              variant="body2"
            >
              Quay lại trang đăng nhập
            </Link>
          </Box>

          {/* Hidden form for EmailJS */}
          <form ref={resetFormRef} style={{ display: 'none' }}>
            <input type="text" name="to_email" defaultValue={resetData?.to_email || ''} />
            <input type="text" name="reset_link" defaultValue={resetData?.reset_link || ''} />
          </form>
        </Card>
      </ForgotPasswordContainer>
    </CssBaseline>
  );
} 
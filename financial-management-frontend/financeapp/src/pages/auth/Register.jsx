import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { register as registerUser } from '../../config/axiosInstance';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';

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
import { styled } from '@mui/material/styles';
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

const RegisterContainer = styled(Stack)(({ theme }) => ({
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

  // Xử lý đăng ký tài khoản
  const handleSubmit = async (values, { setSubmitting }) => {
    setMessage('');

    try {
      const response = await registerUser(values.username, values.email, values.password);
      setIsSuccess(true);

      if (response.data && response.data.activationLink) {
        setMessage(`Registration successful! Preparing to send activation email to ${values.email}...`);
        setActivationData({
          to_email: values.email,
          activation_link: response.data.activationLink,
        });
      } else {
        setMessage('Registration successful! Please check your email to activate your account.');
      }
    } catch (error) {
      setIsSuccess(false);
      const errorMessage =
        error.response?.data?.message || 'Registration failed. Please try again.';
      setMessage(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Gửi email kích hoạt
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

      if (result.status === 200) {
        setMessage(`Registration successful! Activation email has been sent to ${activationData.to_email}`);
      } else {
        setMessage(
          'Registration successful, but unable to send activation email. Please contact the administrator.'
        );
      }
    } catch (error) {
      console.error('Error sending activation email:', error);
      setMessage(
        'Registration successful, but unable to send activation email. Please contact the administrator.'
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Gửi email kích hoạt khi có dữ liệu
  useEffect(() => {
    if (activationData) {
      sendActivationEmail();
    }
  }, [activationData]);

  return (
    <CssBaseline>
      <RegisterContainer direction="column" justifyContent="space-between">
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
              <PersonAddIcon />
            </Box>
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center' }}
            >
              Register Account
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
              <Typography>Sending activation email...</Typography>
            </Box>
          )}

          {!isSuccess && (
            <Formik
              initialValues={{
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
              }}
              validationSchema={RegisterSchema}
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
                      <FormLabel htmlFor="username">Username</FormLabel>
                      <Field name="username">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="username"
                            placeholder="Username"
                            autoComplete="username"
                            autoFocus
                            fullWidth
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                          />
                        )}
                      </Field>
                    </FormControl>

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
                            fullWidth
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                          />
                        )}
                      </Field>
                    </FormControl>

                    <FormControl>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Field name="password">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="password"
                            placeholder="••••••"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            fullWidth
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
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
                        )}
                      </Field>
                    </FormControl>

                    <FormControl>
                      <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                      <Field name="confirmPassword">
                        {({ field, meta }) => (
                          <TextField
                            {...field}
                            id="confirmPassword"
                            placeholder="••••••"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            fullWidth
                            error={meta.touched && Boolean(meta.error)}
                            helperText={meta.touched && meta.error}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    aria-label="toggle password visibility"
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
                        )}
                      </Field>
                    </FormControl>

                    <FormControlLabel
                      control={<Checkbox value="allowExtraEmails" color="primary" />}
                      label="I want to receive notifications via email."
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Registering...' : 'Register'}
                    </Button>
                  </Box>
                </Form>
              )}
            </Formik>
          )}

          {isSuccess ? (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
              >
                Back to login page
              </Link>
            </Box>
          ) : (
            <>
              <Divider sx={{ my: 2 }}>or</Divider>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography sx={{ textAlign: 'center' }}>
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                  >
                    Login
                  </Link>
                </Typography>
              </Box>
            </>
          )}

          {/* Hidden form for EmailJS */}
          <form ref={activationFormRef} style={{ display: 'none' }}>
            <input type="text" name="to_email" defaultValue={activationData?.to_email || ''} />
            <input
              type="text"
              name="activation_link"
              defaultValue={activationData?.activation_link || ''}
            />
          </form>
        </Card>
      </RegisterContainer>
    </CssBaseline>
  );
} 
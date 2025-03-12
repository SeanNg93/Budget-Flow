import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { login } from '../../services/api';

// Material UI imports
import {
  Box,
  Button,
  Checkbox,
  Container,
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
import { Visibility, VisibilityOff, Google, Facebook } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

// Validation schema
const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Tên đăng nhập không được để trống'),
  password: Yup.string().required('Mật khẩu không được để trống'),
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

const LoginContainer = styled(Stack)(({ theme }) => ({
  height: 'calc(100dvh)',
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

// Logo component
const SitemarkIcon = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: 2,
    }}
  >
    <Box
      sx={{
        backgroundColor: 'primary.main',
        borderRadius: '50%',
        p: 1,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LockOutlinedIcon />
    </Box>
  </Box>
);

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setError('');

    try {
      const response = await login(values.username, values.password);
      
      if (response.data.token) {
        localStorage.setItem('userToken', response.data.token);
        navigate('/dashboard');
      } else {
        setError('Đăng nhập thất bại. Máy chủ không phản hồi hợp lệ.');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CssBaseline>
      <LoginContainer direction="column" justifyContent="space-between">
        <Card elevation={3}>
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center', mb: 2 }}
          >
            Đăng nhập
          </Typography>

          {error && (
            <Typography color="error" sx={{ mt: 1, textAlign: 'center', mb: 2 }}>
              {error}
            </Typography>
          )}

          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
            validateOnChange={false}
            validateOnBlur={false}
          >
            {({ errors, touched, isSubmitting, handleSubmit: formikSubmit }) => (
              <Form>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    gap: 2,
                  }}
                >
                  <FormControl>
                    <FormLabel htmlFor="username">Tên đăng nhập</FormLabel>
                    <Field name="username">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="username"
                          placeholder="Tên đăng nhập"
                          autoComplete="username"
                          autoFocus
                          fullWidth
                          variant="outlined"
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                        />
                      )}
                    </Field>
                  </FormControl>

                  <FormControl>
                    <FormLabel htmlFor="password">Mật khẩu</FormLabel>
                    <Field name="password">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          id="password"
                          placeholder="••••••"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          fullWidth
                          variant="outlined"
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

                  <FormControlLabel
                    control={<Checkbox value="remember" color="primary" />}
                    label="Ghi nhớ đăng nhập"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{ mt: 1 }}
                    onClick={() => {
                      formikSubmit();
                    }}
                  >
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>

                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    sx={{ alignSelf: 'center', mt: 1 }}
                  >
                    Quên mật khẩu?
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 2 }}>hoặc</Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Google />}
              onClick={() => alert('Đăng nhập với Google')}
            >
              Đăng nhập với Google
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Facebook />}
              onClick={() => alert('Đăng nhập với Facebook')}
            >
              Đăng nhập với Facebook
            </Button>
            
            <Typography sx={{ textAlign: 'center', mt: 1 }}>
              Chưa có tài khoản?{' '}
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Đăng ký
              </Link>
            </Typography>
          </Box>
        </Card>
      </LoginContainer>
    </CssBaseline>
  );
} 
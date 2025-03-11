import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { activateAccount } from '../../services/api';

// Material UI imports
import {
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

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

const ActivateAccountContainer = styled(Stack)(({ theme }) => ({
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

export default function ActivateAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Extract token from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      activateUserAccount(tokenFromUrl);
    } else {
      setMessage('Mã kích hoạt không hợp lệ hoặc bị thiếu. Vui lòng kiểm tra lại liên kết kích hoạt.');
    }
  }, [location]);

  const activateUserAccount = async (activationToken) => {
    setIsActivating(true);
    setMessage('Đang kích hoạt tài khoản...');
    
    try {
      const response = await activateAccount(activationToken);
      setIsSuccess(true);
      setMessage(response.data.message || 'Tài khoản đã được kích hoạt thành công! Bạn có thể đăng nhập ngay bây giờ.');
    } catch (error) {
      setIsSuccess(false);
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || JSON.stringify(error.response.data))
        : 'Không thể kích hoạt tài khoản. Liên kết có thể đã hết hạn hoặc không hợp lệ.';
      setMessage(errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <CssBaseline>
      <ActivateAccountContainer direction="column" justifyContent="space-between">
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
                backgroundColor: isSuccess ? 'success.main' : (isActivating ? 'primary.main' : 'error.main'),
                borderRadius: '50%',
                p: 1,
                mb: 1,
                color: 'white',
              }}
            >
              {isSuccess ? (
                <CheckCircleOutlineIcon />
              ) : isActivating ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <ErrorOutlineIcon />
              )}
            </Box>
            <Typography
              component="h1"
              variant="h4"
              sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center' }}
            >
              Kích hoạt tài khoản
            </Typography>
          </Box>

          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            {message}
          </Typography>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              color={isSuccess ? 'primary' : 'secondary'}
              fullWidth
            >
              {isSuccess ? 'Đăng nhập ngay' : 'Quay lại trang đăng nhập'}
            </Button>
          </Box>
        </Card>
      </ActivateAccountContainer>
    </CssBaseline>
  );
} 
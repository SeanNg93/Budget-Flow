import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import './styles/globals.css';
import {GoogleOAuthProvider} from "@react-oauth/google";
import { datePickersCustomizations } from './theme/customizations/datePickers';

// Import i18n config
import './i18n/i18n';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    ...datePickersCustomizations,
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId="266978972332-k0oi6ke433g6ei92nsuu3nav44utlpvn.apps.googleusercontent.com">
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <App />
        <ToastContainer 
          position="top-right" 
          autoClose={2000} 
          hideProgressBar={false} 
          newestOnTop 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover 
          theme="colored"
        />
      </LocalizationProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
);
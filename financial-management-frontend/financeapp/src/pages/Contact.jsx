import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs.config';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import styles from '../styles/contact.module.css';

export default function Contact() {
  const formRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setMessage('');

    try {
      const result = await sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.contactTemplateId,
        formRef.current,
        EMAILJS_CONFIG.publicKey
      );
      
      setIsSuccess(true);
      setMessage('Thank you for your message! We will get back to you soon.');
      reset();
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.text || 'Failed to send message. Please try again.');
      console.error('Email sending failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" className={styles.contactContainer}>
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Have a question? We'd love to hear from you.
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        {message && (
          <Alert 
            severity={isSuccess ? "success" : "error"} 
            sx={{ mb: 3 }}
          >
            {message}
          </Alert>
        )}

        <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <TextField
            id="from_name"
            name="from_name"
            label="Name"
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors.from_name}
            helperText={errors.from_name?.message}
            inputProps={{
              ...register('from_name', { required: 'Name is required' })
            }}
          />

          <TextField
            id="from_email"
            name="from_email"
            label="Email"
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors.from_email}
            helperText={errors.from_email?.message}
            inputProps={{
              ...register('from_email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })
            }}
          />

          <TextField
            id="message"
            name="message"
            label="Message"
            fullWidth
            margin="normal"
            variant="outlined"
            multiline
            rows={4}
            error={!!errors.message}
            helperText={errors.message?.message}
            inputProps={{
              ...register('message', { required: 'Message is required' })
            }}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              component={Link} 
              to="/"
              variant="outlined"
              color="primary"
            >
              Back to Home
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
} 
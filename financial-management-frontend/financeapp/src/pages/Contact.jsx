import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs.config';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setMessage(t('contact.messageSent', 'Thank you for your message! We will get back to you soon.'));
      reset();
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.text || t('contact.sendFailed', 'Failed to send message. Please try again.'));
      console.error('Email sending failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" className={styles.contactContainer}>
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h2" gutterBottom>
          {t('contact.title', 'Contact Us')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('contact.subtitle', 'Have a question? We\'d love to hear from you.')}
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
            label={t('contact.name', 'Name')}
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors.from_name}
            helperText={errors.from_name?.message}
            inputProps={{
              ...register('from_name', { 
                required: t('contact.errors.nameRequired', 'Name is required') 
              })
            }}
          />

          <TextField
            id="from_email"
            name="from_email"
            label={t('contact.email', 'Email')}
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors.from_email}
            helperText={errors.from_email?.message}
            inputProps={{
              ...register('from_email', { 
                required: t('contact.errors.emailRequired', 'Email is required'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('contact.errors.emailInvalid', 'Invalid email address')
                }
              })
            }}
          />

          <TextField
            id="message"
            name="message"
            label={t('contact.message', 'Message')}
            fullWidth
            margin="normal"
            variant="outlined"
            multiline
            rows={4}
            error={!!errors.message}
            helperText={errors.message?.message}
            inputProps={{
              ...register('message', { 
                required: t('contact.errors.messageRequired', 'Message is required') 
              })
            }}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              component={Link} 
              to="/"
              variant="outlined"
              color="primary"
            >
              {t('contact.backToHome', 'Back to Home')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? t('contact.sending', 'Sending...') : t('contact.sendMessage', 'Send Message')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
} 
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { requestPasswordReset } from '../services/api';
import { sendForm } from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../config/emailjs.config';
import Link from 'next/link';

export default function ForgotPassword() {
  const resetFormRef = useRef();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [resetData, setResetData] = useState(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const response = await requestPasswordReset(data.email);
      setIsSuccess(true);
      
      // If the response contains a reset link, prepare to send an email
      if (response.data && response.data.resetLink) {
        setMessage('Password reset request received! Preparing email...');
        setResetData({
          to_email: data.email,
          reset_link: response.data.resetLink
        });
      } else {
        setMessage(response.data.message || 'Password reset instructions sent to your email.');
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
      setIsSubmitting(false);
    }
  };

  const sendResetEmail = async () => {
    if (!resetData) return;
    
    setIsSendingEmail(true);
    setMessage('Sending password reset email...');
    
    try {
      const result = await sendForm(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.resetTemplateId,
        resetFormRef.current,
        EMAILJS_CONFIG.publicKey
      );
      
      setMessage('Password reset instructions sent to your email.');
      
      // For development/testing, still show the reset link
      if (process.env.NODE_ENV === 'development') {
        setMessage(prevMessage => prevMessage + '\n\nReset Link (for testing): ' + resetData.reset_link);
      }
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      setMessage('Password reset request received! However, we could not send the email. Please use the reset link below.');
      
      // Always show the reset link if email sending fails
      setMessage(prevMessage => prevMessage + '\n\nReset Link: ' + resetData.reset_link);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Send reset email when resetData is set
  useEffect(() => {
    if (resetData) {
      sendResetEmail();
    }
  }, [resetData]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Reset your password
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>
        
        {message && (
          <div className={isSuccess ? 'alert alert-success' : 'alert alert-danger'}>
            <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
          </div>
        )}
        
        {/* Hidden form for reset email */}
        <form ref={resetFormRef} style={{ display: 'none' }}>
          <input type="hidden" name="to_email" value={resetData?.to_email || ''} />
          <input type="hidden" name="reset_link" value={resetData?.reset_link || ''} />
        </form>
        
        {!isSuccess && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-control"
                placeholder="Email address"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && (
                <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.email.message}</p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={isSubmitting || isSendingEmail}
                className="btn"
                style={{ width: '100%' }}
              >
                {isSubmitting ? 'Sending...' : isSendingEmail ? 'Sending Email...' : 'Send reset link'}
              </button>
            </div>
          </form>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link href="/login" style={{ color: '#4f46e5', fontWeight: '500' }}>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
} 
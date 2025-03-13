import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { changePassword } from '../../config/axiosInstance';

// Material UI imports
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Validation schema
const ChangePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Current password is required'),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ChangePassword = ({ open, onClose }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({ message: '', severity: 'info', show: false });

  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setStatus({
        message: 'Password changed successfully!',
        severity: 'success',
        show: true
      });
      resetForm();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.';
      setStatus({
        message: errorMessage,
        severity: 'error',
        show: true
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <Formik
        initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
        validationSchema={ChangePasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <DialogContent>
              <DialogContentText>
                To change your password, please enter your current password and then your new password.
              </DialogContentText>
              
              {status.show && (
                <Alert severity={status.severity} sx={{ mb: 2 }}>
                  {status.message}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Field name="currentPassword">
                  {({ field, meta }) => (
                    <FormControl error={meta.touched && Boolean(meta.error)}>
                      <TextField
                        {...field}
                        label="Current Password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        fullWidth
                        error={meta.touched && Boolean(meta.error)}
                        helperText={meta.touched && meta.error}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowCurrentPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </FormControl>
                  )}
                </Field>

                <Field name="newPassword">
                  {({ field, meta }) => (
                    <FormControl error={meta.touched && Boolean(meta.error)}>
                      <TextField
                        {...field}
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        fullWidth
                        error={meta.touched && Boolean(meta.error)}
                        helperText={meta.touched && meta.error}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowNewPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </FormControl>
                  )}
                </Field>

                <Field name="confirmPassword">
                  {({ field, meta }) => (
                    <FormControl error={meta.touched && Boolean(meta.error)}>
                      <TextField
                        {...field}
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
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
                    </FormControl>
                  )}
                </Field>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="primary">
                Cancel
              </Button>
              <Button 
                type="submit" 
                color="primary" 
                variant="contained" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ChangePassword; 
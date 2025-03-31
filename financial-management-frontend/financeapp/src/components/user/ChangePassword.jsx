import React, { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { changePassword } from '../../config/axiosInstance';
import { useTranslation } from 'react-i18next';

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

const ChangePassword = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({ message: '', severity: 'info', show: false });

  // Validation schema - created inside component to access translation function
  const ChangePasswordSchema = Yup.object().shape({
    currentPassword: Yup.string()
      .required(t('password.errors.currentRequired')),
    newPassword: Yup.string()
      .min(6, t('password.errors.minLength'))
      .required(t('password.errors.newRequired')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword'), null], t('password.errors.mustMatch'))
      .required(t('password.errors.confirmRequired')),
  });

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
        message: t('password.changeSuccess'),
        severity: 'success',
        show: true
      });
      resetForm();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('password.changeFailed');
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
      <DialogTitle>{t('password.changePassword')}</DialogTitle>
      <Formik
        initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
        validationSchema={ChangePasswordSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, isSubmitting }) => (
          <Form>
            <DialogContent>
              <DialogContentText>
                {t('password.instructions')}
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
                        label={t('password.current')}
                        type={showCurrentPassword ? 'text' : 'password'}
                        fullWidth
                        error={meta.touched && Boolean(meta.error)}
                        helperText={meta.touched && meta.error}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={t('password.toggleVisibility')}
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
                        label={t('password.new')}
                        type={showNewPassword ? 'text' : 'password'}
                        fullWidth
                        error={meta.touched && Boolean(meta.error)}
                        helperText={meta.touched && meta.error}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={t('password.toggleVisibility')}
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
                        label={t('password.confirm')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        fullWidth
                        error={meta.touched && Boolean(meta.error)}
                        helperText={meta.touched && meta.error}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={t('password.toggleVisibility')}
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
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                color="primary" 
                variant="contained" 
                disabled={isSubmitting}
              >
                {isSubmitting ? t('password.changing') : t('password.changePassword')}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ChangePassword; 
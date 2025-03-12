import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { login } from '../services/api';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await login(data.username, data.password);
      localStorage.setItem('token', response.data.token);
      router.push('/dashboard');
    } catch (error) {
      // Ensure we're not trying to render an object directly
      const errorMessage = error.response?.data 
        ? (typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data))
        : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Sign in to your account
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Or{' '}
            <Link href="/register" style={{ color: '#4f46e5', fontWeight: '500' }}>
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="alert alert-danger">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="form-control"
              placeholder="Username"
              {...register('username', { required: 'Username is required' })}
            />
            {errors.username && (
              <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.username.message}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-control"
              placeholder="Password"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.password.message}</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <Link href="/forgot-password" style={{ color: '#4f46e5', fontWeight: '500', fontSize: '0.875rem' }}>
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn"
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#6b7280' }}>Hoặc đăng nhập bằng</span>
          </div>
          
          <button
            type="button"
            // onClick={() => fetch (`https://github.com/login/oauth/authorize?client_id=Ov23lik6g6WygAhPnsUc` , {mode: 'no-cors'}) }
            onClick={() => window.location.href = `https://github.com/login/oauth/authorize?client_id=Ov23lik6g6WygAhPnsUc`}

            className="btn btn-dark"
            style={{ 
              width: '100%',
              backgroundColor: '#24292e',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <svg height="20" width="20" viewBox="0 0 16 16" version="1.1">
              <path fill="white" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
            </svg>
            Đăng nhập bằng GitHub
          </button>
        </form>
      </div>
    </div>
  );
} 
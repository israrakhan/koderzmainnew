import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';

const parseJwtPayload = (token) => {
  try {
    if (!token) return null;
    const [, payload] = token.split('.');
    return payload ? JSON.parse(atob(payload)) : null;
  } catch {
    return null;
  }
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/login', {
        email,
        password,
      });

      const accessToken = response.data?.accessToken || response.data?.token;
      const refreshToken = response.data?.refreshToken;
      const tokenPayload = parseJwtPayload(accessToken);
      const responseUser = response.data?.user;
      const user = responseUser || {
        id: response.data?.id || response.data?.userId || tokenPayload?.id || tokenPayload?.userId || tokenPayload?.sub,
        username: response.data?.username || response.data?.name || tokenPayload?.preferred_username || tokenPayload?.username || tokenPayload?.name,
        email: response.data?.email || tokenPayload?.email || email,
        role: response.data?.role || tokenPayload?.role || tokenPayload?.roles || tokenPayload?.authorities,
      };

      if (accessToken) {
        localStorage.setItem('token', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (user && typeof user === 'object') {
        localStorage.setItem('user', JSON.stringify(user));
        const roleValue = user.role || user.roles || user.authorities;
        if (roleValue) {
          localStorage.setItem('userRole', Array.isArray(roleValue) ? roleValue[0] : roleValue);
        }
      }

      console.log('Login successful');
      navigate('/dashboard'); // Or wherever the protected page is
    } catch (err) {
      // Handle failure
      if (err.response) {
        const { status, data } = err.response;
        const backendMsg = data?.message || data?.error || (typeof data === 'string' && data.length < 150 ? data : null);
        
        if (backendMsg) {
          setError(backendMsg);
        } else if (status === 401) {
          setError('Incorrect password');
        } else if (status === 403) {
          setError('Invalid credentials');
        } else if (status === 500) {
          setError('Incorrect password or server error');
        } else {
          setError('Login failed. Please try again.');
        }
      } else if (err.request) {
        setError('Cannot reach server. Please check your connection.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;

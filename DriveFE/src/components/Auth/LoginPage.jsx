import React, { useState } from "react";
import api from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import '../../styles/Auth.css';
import { Mail, Lock, UserRoundKey, Eye, EyeOff } from 'lucide-react';

const logo = '/logo.png';

const parseJwtPayload = (token) => {
  try {
    if (!token) return null;
    const [, payload] = token.split('.');
    return payload ? JSON.parse(atob(payload)) : null;
  } catch {
    return null;
  }
};

function LoginPage () {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);
  const [forgetPasswordModal, setForgetPasswordModal] = useState(false);
  const [forgetEmail, setForgetEmail] = useState("");
  const [forgetLoading, setForgetLoading] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 1) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return emailRegex.test(email) && password.trim();
  };

  const handleEmailChange = (e) => {
    const lowerEmail = e.target.value.toLowerCase();
    setEmail(lowerEmail);
    if (touched.email) {
      const newErrors = { ...errors };
      if (!lowerEmail.trim()) {
        newErrors.email = "Email is required";
      } else if (!emailRegex.test(lowerEmail)) {
        newErrors.email = "Please enter a valid email address";
      } else {
        newErrors.email = "";
      }
      setErrors(newErrors);
    }
  };

  const isFieldValid = (field) => {
    return touched[field] && !errors[field] && (field === 'email' ? emailRegex.test(email) : field === 'password' ? password.trim() : false);
  };

  const handlePasswordChange = (e) => {
    let value = e.target.value.slice(0, 32); // Limit to 32 characters
    // Prevent spaces from being entered
    value = value.replace(/\s/g, '');
    setPassword(value);
    if (touched.password) {
      const newErrors = { ...errors };
      if (!value.trim()) {
        newErrors.password = "Password is required";
      } else {
        newErrors.password = "";
      }
      setErrors(newErrors);
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.post(`/login`, {
        email,
        password,
      });

      const accessToken = response.data?.accessToken || response.data?.token;
      const refreshToken = response.data?.refreshToken;
      const tokenPayload = parseJwtPayload(accessToken);
      const responseUser = response.data?.user;
      const user = responseUser || {
        id: response.data?.id || response.data?.userId || tokenPayload?.id || tokenPayload?.userId || tokenPayload?.sub,
        username: response.data?.username || response.data?.userName || response.data?.name || tokenPayload?.preferred_username || tokenPayload?.username || tokenPayload?.name,
        name: response.data?.name || response.data?.userName || response.data?.username || tokenPayload?.name || tokenPayload?.preferred_username || tokenPayload?.username,
        email: response.data?.email || response.data?.emailAddress || tokenPayload?.email || email,
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
        const normalizedRole = Array.isArray(roleValue) ? roleValue[0] : roleValue;
        if (normalizedRole) {
          localStorage.setItem('userRole', normalizedRole);
        }
      }

      setEmail("");
      setPassword("");
      
      const userRole = localStorage.getItem('userRole');
      const isAdmin = userRole && userRole.toString().toUpperCase().includes('ADMIN');
      setTimeout(() => {
        navigate(isAdmin ? '/dashboard' : '/home');
      }, 800);
    } catch (error) {
      let errorMsg = "An error occurred during login";
      
      if (error.response) {
        const { status, data } = error.response;
        // Prioritize backend message if available (common in many backends)
        if (data?.message) {
          errorMsg = data.message;
        } else if (data?.error) {
          errorMsg = data.error;
        } else if (typeof data === 'string' && data.length > 0 && data.length < 150) {
          errorMsg = data;
        } else if (status === 401) {
          errorMsg = "Incorrect password";
        } else if (status === 403) {
          errorMsg = "Invalid credentials";
        } else if (status === 400) {
          errorMsg = "Invalid email or password format";
        } else if (status === 404) {
          errorMsg = "Account not found";
        } else if (status === 500) {
          errorMsg = "Incorrect password or server error";
        }
      } else if (error.request) {
        errorMsg = "Cannot reach server. Please check your connection.";
      }
      
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgetPassword = async (e) => {
    e.preventDefault();
    if (!forgetEmail.trim() || !emailRegex.test(forgetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setForgetLoading(true);
    try {
      await api.post(`/forget-password`, { email: forgetEmail });
      toast.success("OTP sent. Check your inbox for the code.");
      setForgetPasswordModal(false);
      setForgetEmail("");
      navigate(`/reset-password?email=${encodeURIComponent(forgetEmail)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setForgetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
            <span ><img src={logo} style={{width: '42px', height: '49px'}}/></span>
              <span>Koderz Drive</span>
            </div>
            <h2 className="auth-title">Login</h2>
            <p className="auth-subtitle">Secure file storage in the cloud</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Email Address
                <span className="mandatory-indicator">*</span>
              </label>
              <input
                id="email"
                type="email"
                className={`form-input ${errors.email && touched.email ? 'form-input-error' : isFieldValid('email') ? 'form-input-valid' : ''}`}
                placeholder="your@email.com"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                disabled={isLoading}
                required
              />
              {errors.email && touched.email && (
                <span className="error-message">{errors.email}</span>
              )}
              {isFieldValid('email') && (
                <span className="success-message">✓ Email is valid</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Password
                <span className="mandatory-indicator">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${errors.password && touched.password ? 'form-input-error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  disabled={isLoading}
                  maxLength="32"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && touched.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="auth-button auth-button-primary"
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? (
                <>
                  Logging in
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                </>
              ) : (
                <>
                  <UserRoundKey size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Login
                </>
              )}
            </button>

            <div className="auth-link">
              Don't have an account?{' '}
              <a onClick={() => navigate('/register')} disabled={isLoading}>
                Create one
              </a>
            </div>
            <div className="auth-link">
              <a onClick={() => setForgetPasswordModal(true)} disabled={isLoading}>
                Forgot Password?
              </a>
            </div>
          </form>
        </div>
      </div>

      {forgetPasswordModal && (
        <div className="modal-overlay" onClick={() => setForgetPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Forgot Password</h3>
            <p>Enter your email address to receive a password reset link.</p>
            <form onSubmit={handleForgetPassword}>
              <div className="form-group">
                <label htmlFor="forgetEmail">
                  <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Email Address
                </label>
                <input
                  id="forgetEmail"
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={forgetEmail}
                  onChange={(e) => setForgetEmail(e.target.value)}
                  disabled={forgetLoading}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="auth-button auth-button-primary"
                disabled={forgetLoading}
              >
                {forgetLoading ? "Sending..." : "Send Reset Email"}
              </button>
              <button 
                type="button" 
                className="auth-button auth-button-secondary"
                onClick={() => setForgetPasswordModal(false)}
                disabled={forgetLoading}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" theme="colored" />
    </div>
  );
}

export default LoginPage;

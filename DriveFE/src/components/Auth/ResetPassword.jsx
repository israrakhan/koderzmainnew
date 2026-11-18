import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { ToastContainer, toast } from 'react-toastify';
import '../../styles/Auth.css';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const logo = '/logo.png';

function ResetPassword() {
  const location = useLocation();
  const queryEmail = new URLSearchParams(location.search).get('email');
  const [email, setEmail] = useState(location.state?.email || queryEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ email: false, otp: false, newPassword: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  useEffect(() => {
    if (!email) {
      toast.error("Email is required to reset password. Please use Forgot Password again.");
      navigate('/');
    }
  }, [email, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!otp.trim()) {
      newErrors.otp = "OTP is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return (
      emailRegex.test(email) &&
      otp.trim() &&
      newPassword.trim() &&
      confirmPassword.trim() &&
      newPassword === confirmPassword
    );
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
    return touched[field] && !errors[field] && (field === 'email' ? emailRegex.test(email) : true);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.slice(0, 8);
    setOtp(value);
    if (touched.otp) {
      const newErrors = { ...errors };
      if (!value.trim()) {
        newErrors.otp = "OTP is required";
      } else {
        newErrors.otp = "";
      }
      setErrors(newErrors);
    }
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value.slice(0, 32);
    setNewPassword(value);
    if (touched.newPassword) {
      const newErrors = { ...errors };
      if (!value.trim()) {
        newErrors.newPassword = "Password is required";
      } else if (value.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      } else {
        newErrors.newPassword = "";
      }
      setErrors(newErrors);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value.slice(0, 32);
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const newErrors = { ...errors };
      if (!value.trim()) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (value !== newPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      } else {
        newErrors.confirmPassword = "";
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
    const payload = {
      email: email.trim(),
      otp: otp.trim(),
      newPassword: newPassword.trim(),
    };

    try {
      await api.post(`/reset-password`, payload);
      toast.success("Password reset successfully. Please login with your new password.");
      setTimeout(() => navigate("/"), 800);
    } catch (error) {
      let errorMsg = "Failed to reset password";
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (typeof error.response?.data === 'string') {
        errorMsg = error.response.data;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span><img src={logo} style={{width: '42px', height: '49px'}}/></span>
              <span>Koderz Drive</span>
            </div>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">Enter your email, OTP, and new password</p>
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
              <label htmlFor="otp">
                <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                OTP
                <span className="mandatory-indicator">*</span>
              </label>
              <input
                id="otp"
                type="text"
                className={`form-input ${errors.otp && touched.otp ? 'form-input-error' : ''}`}
                placeholder="Enter OTP"
                value={otp}
                onChange={handleOtpChange}
                onBlur={() => handleBlur('otp')}
                disabled={isLoading}
                maxLength="8"
                required
              />
              {errors.otp && touched.otp && (
                <span className="error-message">{errors.otp}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                New Password
                <span className="mandatory-indicator">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${errors.newPassword && touched.newPassword ? 'form-input-error' : ''}`}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  onBlur={() => handleBlur('newPassword')}
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
              {errors.newPassword && touched.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Confirm Password
                <span className="mandatory-indicator">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`form-input ${errors.confirmPassword && touched.confirmPassword ? 'form-input-error' : ''}`}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  disabled={isLoading}
                  maxLength="32"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="auth-button auth-button-primary"
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? (
                <>
                  Resetting
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                </>
              ) : (
                <>
                  <Lock size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                  Reset Password
                </>
              )}
            </button>

            <div className="auth-link">
              <a onClick={() => navigate('/')} disabled={isLoading}>
                Back to Login
              </a>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer position="top-center" theme="colored" />
    </div>
  );
}

export default ResetPassword;
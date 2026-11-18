import React, { useState } from "react";
import api from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import '../../styles/Auth.css';
import { Mail, Lock, User, CheckLine, Eye, EyeOff } from 'lucide-react';

function Register() {
  const logo = '/logo.png';
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("details"); // "details", "otp", "registered"
  const [errors, setErrors] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const roles = "ROLE_USER"; // Hardcoded to ROLE_USER
  const navigate = useNavigate();

  // Password strength calculator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (pwd.length >= 6) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 12.5;
    if (/[0-9]/.test(pwd)) strength += 12.5;
    if (/[!@#$%^&*]/.test(pwd)) strength += 25;
    
    let label = "Weak";
    let color = "#ef4444";
    if (strength >= 75) {
      label = "Strong";
      color = "#22c55e";
    } else if (strength >= 50) {
      label = "Medium";
      color = "#f59e0b";
    }
    
    return { strength: Math.min(strength, 100), label, color };
  };

  // Password requirements checker
  const getPasswordRequirements = (pwd) => {
    return {
      minLength: pwd.length >= 6,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      noSpaces: !/\s/.test(pwd)
    };
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const nameRegex = /^[A-Za-z ]+$/;

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = "Full name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters";
    } else if (!nameRegex.test(name.trim())) {
      newErrors.name = "Full name may only contain letters and spaces";
    } else if (name.length > 50) {
      newErrors.name = "Full name cannot exceed 50 characters";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Enter a valid email address";
    }
    
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (/\s/.test(password)) {
      newErrors.password = "Password must not contain spaces";
    } else if (!/^[A-Z]/.test(password)) {
      newErrors.password = "Password must start with a capital letter";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (password.length > 32) {
      newErrors.password = "Password cannot exceed 32 characters";
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return (
      name.trim().length >= 2 &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword &&
      /^[A-Z]/.test(password) &&
      password.length >= 6 &&
      password.length <= 32 &&
      !/\s/.test(password) &&
      !errors.name &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    );
  };

  const handleNameChange = (e) => {
    const inputValue = e.target.value;
    const limitedValue = inputValue.slice(0, 50);
    
    if (touched.name) {
      const trimmedValue = limitedValue.trim();
      if (!trimmedValue) {
        setErrors(prev => ({ ...prev, name: "Full name is required" }));
      } else if (trimmedValue.length < 2) {
        setErrors(prev => ({ ...prev, name: "Full name must be at least 2 characters" }));
      } else if (!nameRegex.test(trimmedValue)) {
        setErrors(prev => ({ ...prev, name: "Full name may only contain letters and spaces" }));
      } else if (limitedValue.length > 50) {
        setErrors(prev => ({ ...prev, name: "Full name cannot exceed 50 characters" }));
      } else {
        setErrors(prev => ({ ...prev, name: "" }));
      }
    }
    
    setName(limitedValue);
  };

  const handleEmailChange = (e) => {
    const lowerEmail = e.target.value.toLowerCase();
    setEmail(lowerEmail);
    if (touched.email) {
      const newErrors = { ...errors };
      if (!lowerEmail.trim()) {
        newErrors.email = "Email is required";
      } else if (!emailRegex.test(lowerEmail)) {
        newErrors.email = "Enter a valid email address";
      } else {
        newErrors.email = "";
      }
      setErrors(newErrors);
    }
  };

  const handlePasswordChange = (e) => {
    let value = e.target.value.slice(0, 32);
    // Prevent spaces from being entered
    value = value.replace(/\s/g, '');
    setPassword(value);
    
    if (touched.password) {
      const newErrors = { ...errors };
      if (!value.trim()) {
        newErrors.password = "Password is required";
      } else if (/\s/.test(value)) {
        newErrors.password = "Password must not contain spaces";
      } else if (!/^[A-Z]/.test(value)) {
        newErrors.password = "Password must start with a capital letter";
      } else if (value.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      } else {
        newErrors.password = "";
      }
      
      // Also validate confirm password if it's been touched
      if (touched.confirmPassword) {
        if (!confirmPassword.trim()) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (value !== confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          newErrors.confirmPassword = "";
        }
      }
      
      setErrors(newErrors);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    let value = e.target.value.slice(0, 32);
    // Prevent spaces from being entered
    value = value.replace(/\s/g, '');
    setConfirmPassword(value);
    
    if (touched.confirmPassword) {
      const newErrors = { ...errors };
      if (!value.trim()) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (password !== value) {
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

  const isFieldValid = (field) => {
    return touched[field] && !errors[field] && (field === 'name' ? name.trim() : field === 'email' ? email.trim() : field === 'password' ? password.trim() : field === 'confirmPassword' ? confirmPassword.trim() : false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/register/send-otp`, {
        email
      });

      if (response.status === 200) {
        toast.success("OTP sent to your email!");
        setStep("otp");
      }
    } catch (error) {
      let errorMsg = "Failed to send OTP";
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMsg = "Email already registered";
      } else if (error.response?.status === 400) {
        errorMsg = "Check your email domain";
      } else if (error.request) {
        errorMsg = "Cannot reach server";
      }
      
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }

    if (otp.length < 4) {
      toast.error("OTP must be at least 4 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/register/verify-otp`, {
        email,
        otp
      });

      if (response.status === 200) {
        toast.success("Email verified successfully!");
        setStep("register");
        // Proceed directly to registration
        await handleRegister();
      }
    } catch (error) {
      let errorMsg = "Failed to verify OTP";
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMsg = "Invalid or expired OTP. Please try again.";
      } else if (error.request) {
        errorMsg = "Cannot reach server";
      }
      
      toast.error(errorMsg);
      setOtp(""); // Clear OTP field on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await api.post(`/register`, {
        name,
        email,
        password,
        roles,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Registration successful! Redirecting to login...");
        setStep("registered");
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      let errorMsg = "Registration failed";
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMsg = "Please check your details and try again";
      } else if (error.response?.status === 409) {
        errorMsg = "Email already exists";
      } else if (error.request) {
        errorMsg = "Cannot reach server";
      }
      
      toast.error(errorMsg);
      setStep("otp"); // Go back to OTP step on registration error
    }
  };

  const handleSubmit = async (e) => {
    if (step === "details") {
      await handleSendOtp(e);
    } else if (step === "otp") {
      await handleVerifyOtp(e);
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
            <h2 className="auth-title">
              {step === "details" && "Create Account"}
              {step === "otp" && "Verify Email"}
              {step === "registered" && "Welcome!"}
            </h2>
            <p className="auth-subtitle">
              {step === "details" && "Join now and start storing files securely"}
              {step === "otp" && "Enter the OTP sent to your email"}
              {step === "registered" && "Your account is ready!"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Step 1: Account Details */}
            {step === "details" && (
              <>
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Full Name
                    <span className="mandatory-indicator">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={`form-input ${errors.name && touched.name ? 'form-input-error' : isFieldValid('name') ? 'form-input-valid' : ''}`}
                    placeholder="John Doe"
                    value={name}
                    onChange={handleNameChange}
                    onBlur={() => handleBlur('name')}
                    onPaste={(e) => {
                      const pasteData = e.clipboardData.getData('text');
                      if (pasteData.length > 50) {
                        e.preventDefault();
                        setErrors(prev => ({ ...prev, name: "Full name cannot exceed 50 characters" }));
                        setTouched(prev => ({ ...prev, name: true }));
                        // Still allow the paste but limit to 50 characters
                        const limitedPaste = pasteData.slice(0, 50);
                        setName(limitedPaste);
                      }
                    }}
                    disabled={isLoading}
                    maxLength="50"
                    required
                  />
                  {errors.name && touched.name && (
                    <span className="error-message">{errors.name}</span>
                  )}
                  {isFieldValid('name') && (
                    <span className="success-message">✓ Full name looks good</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="register-email">
                    <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Email Address
                    <span className="mandatory-indicator">*</span>
                  </label>
                  <input
                    id="register-email"
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
                  <label htmlFor="register-password">
                    <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Password
                    <span className="mandatory-indicator">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      className={`form-input ${errors.password && touched.password ? 'form-input-error' : isFieldValid('password') ? 'form-input-valid' : ''}`}
                      placeholder="Create a strong password"
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
                  {password && !errors.password && (
                    <>
                      <div className="password-strength-container">
                        <div className="password-strength-bar-bg">
                          <div 
                            className="password-strength-bar" 
                            style={{
                              width: `${getPasswordStrength(password).strength}%`,
                              backgroundColor: getPasswordStrength(password).color
                            }}
                          ></div>
                        </div>
                        <span className="password-strength-label" style={{ color: getPasswordStrength(password).color }}>
                          Strength: {getPasswordStrength(password).label}
                        </span>
                      </div>
                      <div className="password-requirements">
                        <div className="requirements-title">Password Requirements:</div>
                        <div className={`requirement-item ${getPasswordRequirements(password).minLength ? 'met' : 'unmet'}`}>
                          <span className="requirement-icon">
                            {getPasswordRequirements(password).minLength ? '✓' : '○'}
                          </span>
                          <span>At least 6 characters</span>
                        </div>
                        <div className={`requirement-item ${getPasswordRequirements(password).hasUpperCase ? 'met' : 'unmet'}`}>
                          <span className="requirement-icon">
                            {getPasswordRequirements(password).hasUpperCase ? '✓' : '○'}
                          </span>
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`requirement-item ${getPasswordRequirements(password).hasNumber ? 'met' : 'unmet'}`}>
                          <span className="requirement-icon">
                            {getPasswordRequirements(password).hasNumber ? '✓' : '○'}
                          </span>
                          <span>One number</span>
                        </div>
                      </div>
                    </>
                  )}
                  {isFieldValid('password') && (
                    <span className="success-message">✓ Password is strong</span>
                  )}
                  {!password && <span className="password-hint"></span>}
                </div>

                <div className="form-group form-group-compact">
                  <label htmlFor="confirm-password">
                    <Lock size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Confirm Password
                    <span className="mandatory-indicator">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-input ${errors.confirmPassword && touched.confirmPassword ? 'form-input-error' : isFieldValid('confirmPassword') ? 'form-input-valid' : ''}`}
                      placeholder="Confirm your password"
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
                  {isFieldValid('confirmPassword') && (
                    <span className="success-message">✓ Passwords match</span>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="auth-button auth-button-primary"
                  disabled={isLoading || !isFormValid()}
                >
                  {isLoading ? (
                    <>
                      Sending OTP
                      <span className="loading-dot">.</span>
                      <span className="loading-dot">.</span>
                      <span className="loading-dot">.</span>
                    </>
                  ) : (
                    <>
                      <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                      Send Verification Code
                    </>
                  )}
                </button>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {step === "otp" && (
              <>
                <div className="form-group">
                  <p className="otp-email-info">
                    Code sent to <strong>{email}</strong>
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="otp">Enter OTP</label>
                  <input
                    id="otp"
                    type="text"
                    className="form-input"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim().toUpperCase())}
                    disabled={isLoading}
                    maxLength="6"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="auth-button auth-button-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      Verifying
                      <span className="loading-dot">.</span>
                      <span className="loading-dot">.</span>
                      <span className="loading-dot">.</span>
                    </>
                  ) : (
                    <>
                      <CheckLine size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                      Verify Code
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="auth-button auth-button-secondary"
                  onClick={() => {
                    setStep("details");
                    setOtp("");
                  }}
                  disabled={isLoading}
                >
                  ← Back to Details
                </button>
              </>
            )}

            {/* Always show login link */}
            {step !== "registered" && (
              <div className="auth-link">
                Already have an account?{' '}
                <a onClick={() => !isLoading && navigate('/')} disabled={isLoading}>
                  Login here
                </a>
              </div>
            )}
          </form>
        </div>
      </div>

      <ToastContainer position="top-center" theme="colored" />
    </div>
  );
}

export default Register;

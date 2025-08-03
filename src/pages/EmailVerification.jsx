import React, { useState, useEffect } from 'react';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../services/firebase"; 

export default function EmailVerification({ email: propEmail, onBack }) {
    const location = useLocation();
    const navigate = useNavigate();
    const locationState = location.state;
    
    const [email, setEmail] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const [isCheckingVerification, setIsCheckingVerification] = useState(false);
    const [authUser, setAuthUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [lastResendTime, setLastResendTime] = useState(0);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Rate limiting - prevent resend within 60 seconds
    const RESEND_COOLDOWN = 60000; // 60 seconds
    const STORAGE_KEY = 'email_verification_last_resend';

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
        setAuthUser(user);
        setAuthLoading(false);
        
        if (user && user.email && !propEmail && !locationState?.email) {
            setEmail(user.email);
        }
        });

        return () => unsubscribe();
    }, [propEmail, locationState?.email]);

  // Set email from various sources
  useEffect(() => {
    if (propEmail) {
      setEmail(propEmail);
    } else if (locationState?.email) {
      setEmail(locationState.email);
    } else if (authUser?.email) {
      setEmail(authUser.email);
    }
  }, [propEmail, locationState?.email, authUser]);

  // Initialize cooldown from localStorage on mount
  useEffect(() => {
    const storedLastResend = localStorage.getItem(STORAGE_KEY);
    if (storedLastResend) {
      const lastResend = parseInt(storedLastResend, 10);
      const now = Date.now();
      const timeSinceLastResend = now - lastResend;
      
      if (timeSinceLastResend < RESEND_COOLDOWN) {
        const remainingCooldown = RESEND_COOLDOWN - timeSinceLastResend;
        setLastResendTime(lastResend);
        setResendCooldown(remainingCooldown);
      }
    }
  }, []);

  // Handle cooldown timer with proper cleanup
  useEffect(() => {
    let timer;
    
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(prev => Math.max(0, prev - 1000));
      }, 1000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  // Function to check if email is verified
  const checkEmailVerification = async () => {
    setIsCheckingVerification(true);
    setResendMessage('');
    
    try {
      const user = auth?.currentUser;
      if (user) {
        await user.reload(); // Refresh user data
        if (user.emailVerified) {
          setResendMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          setResendMessage('Email not verified yet. Please check your inbox or click the resend button.');
        }
      } else {
        setResendMessage('Session expired. Please sign up again.');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setResendMessage('Unable to check verification status. Please try again.');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    const now = Date.now();
    
    // Check rate limiting
    if (now - lastResendTime < RESEND_COOLDOWN) {
      const remainingTime = Math.ceil((RESEND_COOLDOWN - (now - lastResendTime)) / 1000);
      setResendMessage(`Please wait ${remainingTime} seconds before requesting another email.`);
      setResendCooldown((RESEND_COOLDOWN - (now - lastResendTime)));
      return;
    }

    setIsResending(true);
    setResendMessage('');
    
    try {
      const user = auth?.currentUser;
      
      if (!user) {
        setResendMessage('Session expired. Please sign up again to receive a verification email.');
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            navigate('/signup');
          }
        }, 3000);
        return;
      }

      // Reload user to get latest verification status
      await user.reload();
      
      if (user.emailVerified) {
        setResendMessage('Your email is already verified! You can now log in.');
        return;
      }
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Set rate limiting data
      setLastResendTime(now);
      setResendCooldown(RESEND_COOLDOWN);
      localStorage.setItem(STORAGE_KEY, now.toString());
      
      setResendMessage('Verification email sent successfully! Check your inbox and spam folder.');
      
    } catch (error) {
      console.error('Error resending verification:', error);
      
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/too-many-requests':
            errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
            // Don't set lastResendTime on Firebase rate limit error
            setResendCooldown(RESEND_COOLDOWN);
            break;
          case 'auth/user-not-found':
            errorMessage = 'User not found. Please sign up again.';
            setTimeout(() => navigate('/signup'), 2000);
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address. Please sign up again.';
            break;
          default:
            errorMessage = `Error: ${error.message}`;
        }
      }
      
      setResendMessage(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/login");
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if no email is available
  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No email found. Redirecting to signup...</p>
          <Link to="/signup" className="text-blue-600 hover:text-blue-800">
            Go to Signup
          </Link>
        </div>
      </div>
    );
  }

  const isResendDisabled = isResending || resendCooldown > 0;
  const resendButtonText = isResending 
    ? 'Resending...' 
    : resendCooldown > 0 
      ? `Wait ${Math.ceil(resendCooldown / 1000)}s`
      : 'Resend Verification Email';

  // Determine back button text based on context
  const backButtonText = onBack ? 'Back to Signup' : 'Back to Login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-montserrat">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Email Icon */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          
          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Check Your Email
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            We've sent a verification link to
            <span className="font-semibold text-gray-900 block mt-1">
              {email}
            </span>
          </p>
          
          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 leading-relaxed">
              Click the link in the email to verify your account. 
              If you don't see it, check your spam folder.
            </p>
          </div>
          
          {/* Cooldown Progress Bar */}
          {resendCooldown > 0 && (
            <div className="mb-4">
              <div className="bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000 cursor-pointer"
                  style={{ width: `${((RESEND_COOLDOWN - resendCooldown) / RESEND_COOLDOWN) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                Next resend available in {Math.ceil(resendCooldown / 1000)} seconds
              </p>
            </div>
          )}
          
          {/* Check Verification Status Button */}
          <button
            onClick={checkEmailVerification}
            disabled={isCheckingVerification}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 mb-4"
          >
            {isCheckingVerification ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                I've Verified My Email
              </>
            )}
          </button>

          {/* Resend Button */}
          <button
            onClick={handleResendVerification}
            disabled={isResendDisabled}
            className="w-full bg-gray-700 text-white py-3 px-4 rounded-lg cursor-pointer font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2 mb-4"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                {resendButtonText}
              </>
            )}
          </button>
          
          {/* Resend Message */}
          {resendMessage && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${
              resendMessage.includes('successfully') || resendMessage.includes('verified')
                ? 'bg-green-50 text-green-800' 
                : resendMessage.includes('wait') || resendMessage.includes('Wait')
                  ? 'bg-yellow-50 text-yellow-800'
                  : 'bg-red-50 text-red-800'
            }`}>
              {resendMessage}
            </div>
          )}
          
          {/* Back Button */}
          {onBack ? (
            <button
              onClick={handleBackToLogin}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg cursor-pointer font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {backButtonText}
            </button>
          ) : (
            <Link 
              to="/login"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg cursor-pointer font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2 inline-flex"
            >
              <ArrowLeft className="w-4 h-4" />
              {backButtonText}
            </Link>
          )}
          
          {/* Additional Help */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 leading-relaxed">
              Having trouble? Make sure to check your spam folder or 
              <button 
                onClick={handleResendVerification}
                disabled={isResendDisabled}
                className={`ml-1 underline cursor-pointer ${
                  isResendDisabled 
                    ? 'text-gray-400' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                request a new verification email
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
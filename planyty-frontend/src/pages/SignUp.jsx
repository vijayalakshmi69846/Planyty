// SignUp.jsx (FINALIZED: Strong Password Validation with Persistent Error States)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Mail, Lock, User, UserPlus, LogIn, ArrowLeft, Sparkles, Shield, AlertTriangle, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';

// --- HELPER FUNCTIONS ---

const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(String(email).toLowerCase());
};

const getPasswordValidationErrors = (password) => {
    if (!password || password.trim() === '') {
        return 'Password is required.';
    }
    
    const errors = [];
    if (password.length < 8) {
        errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('One number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('One special character');
    }
    
    return errors.length > 0 ? `Needs: ${errors.join(', ')}` : null; 
}

const checkPasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, strength: '', color: 'text-gray-400', width: '0%', requirements: { length: false, uppercase: false, number: false, special: false } };

    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    if (requirements.length) score += 1;
    if (requirements.uppercase) score += 1;
    if (requirements.number) score += 1;
    if (requirements.special) score += 1;
    
    let strength = 'Weak';
    let color = 'text-red-500';
    let width = '25%';

    if (score === 2) {
        strength = 'Medium';
        color = 'text-yellow-500';
        width = '50%';
    } else if (score >= 3) {
        strength = 'Strong';
        color = 'text-green-500';
        width = '100%';
    }

    return { score, strength, color, width, requirements };
};

// ----------------------------

const ErrorMessage = ({ message, isWarning = false }) => (
    message ? (
        <p className={`text-xs mt-1 animate-fade-in flex items-center font-medium ${isWarning ? 'text-orange-500' : 'text-red-500'}`}>
            <AlertTriangle className="inline w-3 h-3 mr-1" />
            {message}
        </p>
    ) : null
);

const PasswordStrengthIndicator = ({ strength, color, width }) => (
    <div className="mt-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full transition-all duration-500 ease-in-out 
                            ${strength === 'Strong' ? 'bg-green-500' : strength === 'Medium' ? 'bg-yellow-500' : strength === 'Weak' ? 'bg-red-500' : 'bg-transparent'}`}
                style={{ width }}
            ></div>
        </div>
        {strength && (
            <p className={`text-right text-xs font-semibold mt-1 ${color}`}>{strength}</p>
        )}
    </div>
);


const SignUp = () => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(''));
  const [showPassword, setShowPassword] = useState(false); 
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const { 
    initiateSignup, 
    acceptInvitation, 
    invitationToken, 
    invitationRole,
    signupEmail,
    login
  } = useAuth();
  
  const navigate = useNavigate();

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (loading && !success) {
      const timeoutId = setTimeout(() => {
        console.log("⏰ Safety timeout triggered - request taking too long");
        setLoading(false);
        setDebugInfo("Request timed out after 15 seconds. Please check your network or try again.");
        setFieldErrors({ 
          password: "Request timed out. Please try again." 
        });
      }, 15000); // 15 seconds timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, success]);

  // ⭐ MODIFIED: Ensures empty fields trigger error immediately
  const handlePasswordChange = (value, field) => {
    if (field === 'password') {
        setPassword(value);
        setPasswordStrength(checkPasswordStrength(value));
        
        // Show "Required" or "Requirements" error even if user deletes everything
        const error = getPasswordValidationErrors(value);
        setFieldErrors(prev => ({ ...prev, password: error }));

    } else if (field === 'confirmPassword') {
        setConfirmPassword(value);
        let error = null;
        if (!value || value.trim() === '') {
            error = 'Please confirm your password.';
        } else if (value !== password) {
            error = 'Passwords do not match.';
        }
        setFieldErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleEmailSubmit = async () => {
    setFieldErrors({});
    setDebugInfo('');
    
    const errors = {};
    if (!email || email.trim() === '') {
        errors.email = 'Please enter your email address.';
    } else if (!validateEmail(email)) {
        errors.email = 'Please enter a valid email address.';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const result = await initiateSignup(email); 
      if (result.is_invited && result.invitation_token) {
        setStep('password');
      } else {
        setFieldErrors({ email: 'Invitation status could not be confirmed.' }); 
      }
    } catch (err) {
      setFieldErrors({ email: err.message || 'Failed to check invitation status.' });
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    console.log("🔄 handlePasswordSubmit started", {
      hasToken: !!invitationToken,
      tokenLength: invitationToken?.length,
      name,
      email: signupEmail
    });
    
    // Validate all fields
    const errors = {};
    if (!name || name.trim() === '') {
      errors.name = 'Full name is required.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (passwordStrength.strength === 'Weak') {
      errors.password = 'Password is too weak. Please meet all requirements.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setFieldErrors({});
    setDebugInfo('Submitting account creation request...');

    try {
      console.log("📤 Calling acceptInvitation with token:", invitationToken?.substring(0, 20) + '...');
      
      // Try to create account
      const result = await acceptInvitation(invitationToken, name, password);
      console.log("✅ acceptInvitation succeeded:", result);
      
      // If we get here, account was created successfully
      setSuccess(true);
      setDebugInfo('Account created successfully! Redirecting...');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
      
    } catch (err) {
      console.error("❌ acceptInvitation failed:", err);
      setDebugInfo(`Error details: ${err.message}`);
      
      // Handle different error cases
      if (err.message?.includes('already exists') || err.status === 409) {
        console.log("User already exists, trying to login...");
        setDebugInfo('Account already exists. Attempting to login...');
        
        // Try to login with the newly created credentials
        try {
          await login(signupEmail, password);
          setDebugInfo('Auto-login successful! Redirecting...');
          setTimeout(() => navigate('/dashboard'), 1000);
        } catch (loginErr) {
          console.error("Auto-login failed:", loginErr);
          setDebugInfo('Auto-login failed. Redirecting to login page...');
          // If login fails, redirect to login page
          navigate('/login', { 
            state: { 
              preFilledEmail: signupEmail,
              message: "Account already exists. Please log in." 
            } 
          });
        }
      } else if (err.message?.includes('timed out')) {
        setFieldErrors({ 
          password: 'Server is taking too long to respond. Please try again later.' 
        });
      } else {
        setFieldErrors({ 
          password: err.message || 'Failed to create account. Please try again.' 
        });
      }
    } finally {
      if (!success) {
        setLoading(false);
      }
    }
  };

  const retryAccountCreation = async () => {
    setFieldErrors({});
    setDebugInfo('Retrying account creation...');
    await handlePasswordSubmit({ preventDefault: () => {} });
  };

  const goBack = () => {
    setFieldErrors({});
    setDebugInfo('');
    setStep('email');
  };

  // Success screen
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-center">
          <div className="animate-bounce-in">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-800">
              Account Created Successfully! 🎉
            </h2>
            <p className="text-gray-600 mt-2">
              Welcome to the team, <strong className="text-purple-600">{name}</strong>!
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to dashboard...
            </p>
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-progress"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'email') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 animate-float">
          <div className="text-center animate-bounce-in">
            <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Check Invitation Status
            </h2>
            <p className="text-gray-600 mt-2 animate-fade-in">Enter your invited email address</p>
          </div>

          <div className="space-y-4 animate-slide-up delay-200">
            <div className="animate-float delay-300">
              <label className="block text-sm font-medium text-gray-700 sr-only">Email</label>
              <div className="relative">
                <Mail className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 animate-pulse ${fieldErrors.email ? 'text-red-500' : 'text-purple-500'}`} />
                <Input
                  type="email"
                  placeholder="Invited Email Address"
                  value={email}
                  onChange={(e) => {
                      setEmail(e.target.value);
                      // Clear error or show "Required" if deleted
                      if (!e.target.value) setFieldErrors({ email: 'Please enter your email address.' });
                      else if (fieldErrors.email) setFieldErrors({ email: null });
                  }}
                  className={`pl-10 transition-all duration-300 hover:scale-105 focus:scale-105 ${fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-purple-200 focus:border-purple-500'}`}
                />
              </div>
              <ErrorMessage message={fieldErrors.email} />
            </div>

            <Button
              type="button"
              onClick={handleEmailSubmit} 
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg animate-pulse-slow border-2 border-transparent hover:border-white/30"
              disabled={loading}
            >
              <Shield className="w-5 h-5 mr-2 animate-bounce" />
              {loading ? 'Checking Invitation... ✨' : 'Check Invitation & Continue'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 animate-fade-in delay-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-purple-600 hover:text-purple-700 transition-all duration-300 hover:scale-110 inline-block">
              <LogIn className="inline w-4 h-4 mr-1 animate-bounce" />
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'password') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 animate-slide-in-left">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center text-gray-600 hover:text-purple-600 transition-all duration-300 hover:scale-105 mb-4 animate-fade-in"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <div className="text-center animate-bounce-in">
            <User className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Accept Invitation & Set Password
            </h2>
            <p className="text-gray-600 mt-2">
              Final steps for <strong className="text-purple-600 animate-pulse">{signupEmail}</strong>
            </p>
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 uppercase">
                <strong>Assigned Role:</strong>{' '}
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {invitationRole ? invitationRole.replace(/_/g, ' ') : 'Loading...'} 👑
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-stagger">
            <div className="animate-slide-up delay-100">
              <div className="relative">
                <User className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 animate-pulse ${fieldErrors.name ? 'text-red-500' : 'text-purple-500'}`} />
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => {
                      setName(e.target.value);
                      if (!e.target.value) setFieldErrors(prev => ({...prev, name: 'Full name is required.'}));
                      else setFieldErrors(prev => ({...prev, name: null}));
                  }}
                  className={`pl-10 transition-all duration-300 hover:scale-105 focus:scale-105 ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-purple-200 focus:border-purple-500'}`}
                  disabled={loading}
                />
              </div>
              <ErrorMessage message={fieldErrors.name} />
            </div>

            <div className="animate-slide-up delay-200">
              <div className="relative">
                <Lock className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 animate-pulse ${fieldErrors.password ? 'text-red-500' : 'text-purple-500'}`} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value, 'password')}
                  className={`pl-10 pr-10 transition-all duration-300 hover:scale-105 focus:scale-105 ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-purple-200 focus:border-purple-500'}`}
                  disabled={loading}
                />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                    disabled={loading}
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthIndicator strength={passwordStrength.strength} color={passwordStrength.color} width={passwordStrength.width} />
              
              <div className="mt-2 text-xs grid grid-cols-2 gap-1">
                <p className={passwordStrength.requirements.length ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                    {passwordStrength.requirements.length ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />} 8+ Characters
                </p>
                <p className={passwordStrength.requirements.uppercase ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                    {passwordStrength.requirements.uppercase ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />} 1 Uppercase
                </p>
                <p className={passwordStrength.requirements.number ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                    {passwordStrength.requirements.number ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />} 1 Number
                </p>
                <p className={passwordStrength.requirements.special ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                    {passwordStrength.requirements.special ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />} 1 Special Char
                </p>
              </div>
              <ErrorMessage message={fieldErrors.password} />
            </div>

            <div className="animate-slide-up delay-300">
              <div className="relative">
                <Lock className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 animate-pulse ${fieldErrors.confirmPassword ? 'text-red-500' : 'text-purple-500'}`} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => handlePasswordChange(e.target.value, 'confirmPassword')}
                  className={`pl-10 pr-10 transition-all duration-300 hover:scale-105 focus:scale-105 ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-purple-200 focus:border-purple-500'}`}
                  disabled={loading}
                />
              </div>
              <ErrorMessage message={fieldErrors.confirmPassword} />
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <p className="font-medium">Debug Info:</p>
                <p>{debugInfo}</p>
                {debugInfo.includes('timed out') && (
                  <button
                    type="button"
                    onClick={retryAccountCreation}
                    className="mt-2 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry Account Creation
                  </button>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={loading || passwordStrength.strength === 'Weak'}
            >
              {loading ? (
                <>
                  <div className="animate-spin mr-2">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  Creating Account... ✨
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2 animate-bounce" />
                  Create Account 🚀
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }
};

export default SignUp;
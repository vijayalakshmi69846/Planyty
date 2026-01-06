import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { 
  Mail, Lock, LogIn, UserPlus, Sparkles, 
  Crown, Users, Eye, EyeOff 
} from 'lucide-react';

// --- HELPER FUNCTIONS ---
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email) return 'Email is required.';
  if (!emailRegex.test(String(email).toLowerCase())) return 'Please enter a valid email address.';
  return null;
};

const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    return null;
}

const ErrorMessage = ({ message }) => (
    message ? <p className="text-red-500 text-xs mt-1 animate-fade-in">{message}</p> : null
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for expired session flag from api.js redirect
  const queryParams = new URLSearchParams(location.search);
  const expired = queryParams.get('expired');

  // Handle Session Expiry Message
  useEffect(() => {
    if (expired) {
      setFieldErrors({ 
        password: 'Your session has expired. Please log in again for security.' 
      });
    }
  }, [expired]);

  const handleLiveValidation = (fieldName, value) => {
    let error = null;
    if (fieldName === 'email') error = validateEmail(value);
    else if (fieldName === 'password') error = validatePassword(value);

    setFieldErrors(prevErrors => ({
        ...prevErrors,
        [fieldName]: error,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const errors = {};
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError; 
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return; 
    }
    
    setFieldErrors({}); 
    
    try {
      await login(email, password);
    } catch (err) {
      setFieldErrors({ password: 'Invalid email or password. Please try again.' });
      console.error("Login API Error:", err); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 animate-float">
        
        <div className="text-center animate-bounce-in">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            Welcome Back
          </h2>
          <p className="text-gray-600 mt-2 animate-fade-in">Sign in to continue to Planyty</p>
        </div>

        <div className="relative animate-fade-in delay-200">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Plan with clarity ! Achieve with Planyty !</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up delay-300">
          {/* Email Input */}
          <div className="animate-float delay-400">
            <div className="relative">
              <Mail className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 ${fieldErrors.email ? 'text-red-500' : 'text-purple-500'}`} />
              <Input
                type="text" 
                placeholder="Email Address"
                value={email} 
                onChange={(e) => {
                    setEmail(e.target.value);
                    handleLiveValidation('email', e.target.value);
                }}
                className={`pl-10 transition-all duration-300 ${fieldErrors.email ? 'border-red-500 focus:ring-red-100' : 'border-purple-200 focus:ring-purple-100'}`}
              />
            </div>
            <ErrorMessage message={fieldErrors.email} /> 
          </div>
          
          {/* Password Input with Toggle & Forgot Password */}
          <div className="animate-float delay-500">
            <div className="relative">
              <Lock className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 ${fieldErrors.password ? 'text-red-500' : 'text-purple-500'}`} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    handleLiveValidation('password', e.target.value);
                }}
                className={`pl-10 pr-10 transition-all duration-300 ${fieldErrors.password ? 'border-red-500' : 'border-purple-200 focus:ring-purple-100'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 focus:outline-none transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex justify-end mt-1">
              <Link 
                to="/forgot-password" 
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <ErrorMessage message={fieldErrors.password} />
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg disabled:opacity-50"
            disabled={loading}
          >
            <LogIn className="w-5 h-5 mr-2" />
            {loading ? 'Logging in...' : 'Sign In 🚀'}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-purple-600 hover:text-purple-700 transition-all">
            <UserPlus className="inline w-4 h-4 mr-1" />
            Sign Up
          </Link>
        </div>

        {/* Role Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">About Roles:</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Crown className="w-3 h-3 text-purple-500" />
              <span><strong>Team Lead:</strong> Create teams and manage projects</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-blue-500" />
              <span><strong>Team Member:</strong> Join and work on tasks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
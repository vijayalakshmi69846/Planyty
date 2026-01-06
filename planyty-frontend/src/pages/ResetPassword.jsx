import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { 
  Lock, CheckCircle2, Eye, EyeOff, ShieldCheck, 
  AlertTriangle, CheckCircle, RefreshCw 
} from 'lucide-react';

// --- HELPER FUNCTIONS ---
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

const ErrorMessage = ({ message }) => (
    message ? (
        <p className="text-xs mt-1 animate-fade-in flex items-center font-medium text-red-500">
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

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(''));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePasswordChange = (value, field) => {
    if (field === 'password') {
        setPassword(value);
        setPasswordStrength(checkPasswordStrength(value));
        setFieldErrors(prev => ({ ...prev, password: value ? null : 'Password is required.' }));
    } else if (field === 'confirmPassword') {
        setConfirmPassword(value);
        let error = null;
        if (!value) error = 'Please confirm your password.';
        else if (value !== password) error = 'Passwords do not match.';
        setFieldErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!password) errors.password = 'Password is required.';
    else if (passwordStrength.strength === 'Weak') errors.password = 'Password is too weak.';
    
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setFieldErrors({ global: err.response?.data?.message || 'Link is invalid or has expired.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] transition-all duration-500">
        
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Update Password
          </h2>
          <p className="text-gray-600 mt-2">
            {success ? "Success! Security updated." : "Secure your Planyty account"}
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {fieldErrors.global && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> {fieldErrors.global}
                </div>
            )}

            {/* New Password Field */}
            <div className="relative">
              <Lock className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 ${fieldErrors.password ? 'text-red-500' : 'text-purple-500'}`} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value, 'password')}
                className="pl-10 pr-10 border-purple-200 focus:ring-purple-100"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <PasswordStrengthIndicator strength={passwordStrength.strength} color={passwordStrength.color} width={passwordStrength.width} />
            
            <div className="mt-2 text-xs grid grid-cols-2 gap-1">
                {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                    <p key={key} className={met ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                        {met ? <CheckCircle className="inline w-3 h-3 mr-1" /> : <AlertTriangle className="inline w-3 h-3 mr-1" />} 
                        {key === 'length' ? '8+ Chars' : key === 'uppercase' ? 'Uppercase' : key === 'number' ? 'Number' : 'Special'}
                    </p>
                ))}
            </div>
            <ErrorMessage message={fieldErrors.password} />

            {/* Confirm Password Field (Updated with Eye Icon) */}
            <div className="relative">
              <Lock className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 ${fieldErrors.confirmPassword ? 'text-red-500' : 'text-purple-500'}`} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => handlePasswordChange(e.target.value, 'confirmPassword')}
                className="pl-10 pr-10 border-purple-200 focus:ring-purple-100"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <ErrorMessage message={fieldErrors.confirmPassword} />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
              disabled={loading || passwordStrength.strength === 'Weak'}
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Update Password 🚀'}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <p className="text-sm text-gray-600">Password reset successful! Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
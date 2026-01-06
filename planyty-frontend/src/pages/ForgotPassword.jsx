import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Mail, Sparkles, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // Calls the forgot-password endpoint we discussed
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-500 animate-float">
        
        <div className="text-center animate-bounce-in">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="text-gray-600 mt-2">
            {submitted 
              ? "Check your inbox for instructions" 
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
            <div className="relative">
              <Mail className={`absolute w-5 h-5 left-3 top-1/2 transform -translate-y-1/2 ${error ? 'text-red-500' : 'text-purple-500'}`} />
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 transition-all duration-300 ${error ? 'border-red-500 focus:ring-red-100' : 'border-purple-200 focus:ring-purple-100'}`}
                required
              />
            </div>

            {error && <p className="text-red-500 text-xs mt-1 animate-fade-in">{error}</p>}

            <Button
              type="submit"
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Reset Link 🚀
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
            </div>
            <p className="text-sm text-gray-600">
              If an account exists for <strong>{email}</strong>, you will receive an email shortly with a link to reset your password.
            </p>
            <Button 
              onClick={() => setSubmitted(false)}
              className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200 py-3 rounded-xl"
            >
              Didn't get an email? Try again
            </Button>
          </div>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="text-sm font-bold text-purple-600 hover:text-purple-700 transition-all flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
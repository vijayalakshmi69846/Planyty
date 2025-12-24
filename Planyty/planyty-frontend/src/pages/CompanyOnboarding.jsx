import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Mail, UserPlus, ChevronRight, 
  CheckCircle, Users, Shield, ArrowLeft,
  Sparkles, Plus, X, AlertTriangle, Loader,
  ShieldAlert
} from 'lucide-react';

// Reusable component with shake animation support
const OnboardingMessage = ({ children, type = 'error' }) => {
    let colorClasses = '';
    let Icon = AlertTriangle;

    if (type === 'error') {
        colorClasses = 'bg-red-50 border-red-200 text-red-800 animate-shake';
        Icon = ShieldAlert;
    } else if (type === 'warning') {
        colorClasses = 'bg-yellow-50 border-yellow-200 text-yellow-800';
        Icon = AlertTriangle;
    } else if (type === 'info') {
        colorClasses = 'bg-blue-50 border-blue-200 text-blue-800';
        Icon = AlertTriangle;
    }

    return (
        <div className={`mt-4 p-3 rounded-lg border flex items-start ${colorClasses} animate-fade-in`}>
            <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
            <div className="text-sm">{children}</div>
        </div>
    );
};

const CompanyOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [adminEmails, setAdminEmails] = useState(['']);
  const [yourEmail, setYourEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitesSent, setInvitesSent] = useState(false);
  const [apiError, setApiError] = useState(null); 
  const [step1Error, setStep1Error] = useState(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

  const handleCompanyNameChange = (e) => {
    setCompanyName(e.target.value);
    setStep1Error(null); 
    setApiError(null);
  };

  const handleYourEmailChange = (e) => {
    setYourEmail(e.target.value);
    setStep1Error(null); 
    setApiError(null);
  };
  
  const handleSetStep = (nextStep) => {
      setApiError(null);
      setStep1Error(null);
      setStep(nextStep);
  }

  // ⭐ Helper for Dynamic Borders and Shake
  const getInputClass = (val, isEmail = false) => {
    const base = "w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 shadow-sm ";
    
    // If there is an error on Step 1, highlight everything in Red + Shake
    if (step1Error) {
        return base + "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100 animate-shake";
    }
    
    // If valid data is present, highlight Green
    const isValid = isEmail ? EMAIL_REGEX.test(val) : val.trim().length >= 2;
    if (isValid) {
        return base + "border-green-400 focus:ring-2 focus:ring-green-100";
    }
    
    // Default Purple
    return base + "border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200";
  };

  const addAdminEmail = () => {
    if (adminEmails.length < 10) {
      setAdminEmails([...adminEmails, '']);
    }
  };

  const removeAdminEmail = (index) => {
    if (adminEmails.length > 1) {
      const newEmails = [...adminEmails];
      newEmails.splice(index, 1);
      setAdminEmails(newEmails);
    }
  };

  const updateAdminEmail = (index, value) => {
    const newEmails = [...adminEmails];
    newEmails[index] = value;
    setAdminEmails(newEmails);
  };

  const handleStep1Continue = async () => {
    const trimmedCompanyName = companyName.trim();
    const trimmedYourEmail = yourEmail.trim().toLowerCase();

    // Local Validation
    if (!trimmedCompanyName || !trimmedYourEmail) {
        setStep1Error("Company name and your email are required.");
        return;
    }
    
    if (!EMAIL_REGEX.test(trimmedYourEmail)) {
        setStep1Error("Please enter a valid email address.");
        return;
    }

    setLoading(true);
    setStep1Error(null);
    
    try {
        const response = await fetch('http://localhost:5000/api/onboard/validate-step1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                companyName: trimmedCompanyName,
                ownerEmail: trimmedYourEmail
            }),
        });

        const data = await response.json();

        if (response.ok) {
            handleSetStep(2);
        } else {
            // ⭐ HANDLE MULTIPLE ERRORS FROM THE BACKEND ARRAY
            if (response.status === 409 && data.errors) {
                // Check if BOTH company and email exist
                const companyErr = data.errors.find(e => e.code === 'COMPANY_EXISTS');
                const emailErr = data.errors.find(e => e.code === 'EMAIL_REGISTERED');

                if (companyErr && emailErr) {
                    setStep1Error(`⚠️ Both the company name and email are already in use.`);
                } else if (companyErr) {
                    setStep1Error(`⚠️ The company name "${trimmedCompanyName}" is already taken.`);
                } else if (emailErr) {
                    setStep1Error(
                        <span>
                            <strong>Account Conflict:</strong> <b>{trimmedYourEmail}</b> is already in use. 
                            <Link to="/login" className="underline font-bold text-red-900 ml-1">Login here</Link>.
                        </span>
                    );
                }
            } else {
                setStep1Error(data.message || "Validation failed. Please try again.");
            }
        }
    } catch (err) {
        setStep1Error("Network error. Please check if the server is running.");
    } finally {
        setLoading(false);
    }
};
const handleSubmit = async () => {
  setLoading(true);
  setApiError(null); 
  setStep1Error(null); 

  try {
    const response = await fetch('http://localhost:5000/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: companyName.trim(),
        adminEmails: adminEmails.filter(email => email.trim() !== ''),
        ownerEmail: yourEmail.trim().toLowerCase()
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setInvitesSent(true);
    } else {
      const errorMessage = data.message || 'An unknown error occurred on the server.';
      setLoading(false); 

      if (response.status === 409) {
          setStep1Error(`Conflict detected: ${errorMessage}`);
          handleSetStep(1);
      } else {
          setApiError(`Failed to process (Status ${response.status}): ${errorMessage}`);
      }
    }
  } catch (error) {
    setApiError('Network error. Please check your connection.');
    setLoading(false); 
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${step >= num 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                  ${step === num ? 'ring-4 ring-purple-200 animate-pulse' : ''}
                `}>
                  {step > num ? <CheckCircle className="w-5 h-5" /> : num}
                </div>
                <div className="text-sm font-medium ml-2">
                  {num === 1 && 'Company'}
                  {num === 2 && 'Admins'}
                  {num === 3 && 'Confirm'}
                </div>
              </div>
              {num < 3 && (
                <div className={`
                  w-16 h-1 mx-4
                  ${step > num ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl p-8">
          {!invitesSent ? (
            <>
              {/* Step 1: Company Info */}
              {step === 1 && (
                <div className="space-y-8 animate-slide-in-right">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-10 h-10 text-purple-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Welcome to Planyty! 🎉
                    </h2>
                    <p className="text-gray-600">
                      Let's get your company set up in minutes
                    </p>
                  </div>
                  
                  {step1Error && <OnboardingMessage type="error">{step1Error}</OnboardingMessage>}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={handleCompanyNameChange} 
                        placeholder="Acme Inc."
                        className={getInputClass(companyName)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email Address
                      </label>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${step1Error ? 'text-red-400' : 'text-purple-400'}`} />
                        <input
                          type="email"
                          value={yourEmail}
                          onChange={handleYourEmailChange} 
                          placeholder="you@company.com"
                          className={`${getInputClass(yourEmail, true)} pl-12 pr-4`}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        We'll send your invitation link here
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Link
                      to="/"
                      className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Home
                    </Link>
                    <button
                      onClick={handleStep1Continue}
                      disabled={!companyName.trim() || !yourEmail.trim() || loading}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center shadow-lg"
                    >
                      {loading ? (
                          <>
                            <Loader className="animate-spin w-5 h-5 mr-2" />
                            Checking...
                          </>
                      ) : (
                          <>
                            Continue
                            <ChevronRight className="w-5 h-5 ml-2" />
                          </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Admin Emails */}
              {step === 2 && (
                <div className="space-y-8 animate-slide-in-right">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
                      <Users className="w-10 h-10 text-purple-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Invite Team Leaders
                    </h2>
                    <p className="text-gray-600">
                      Add emails of people who should have admin access
                    </p>
                  </div>

                  <div className="space-y-4">
                    {adminEmails.map((email, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => updateAdminEmail(index, e.target.value)}
                            placeholder={`admin${index + 1}@${companyName.toLowerCase().replace(/\s+/g, '')}.com`}
                            className="w-full pl-12 pr-10 py-3 rounded-xl border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-300"
                          />
                          {adminEmails.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAdminEmail(index)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {adminEmails.length < 10 && (
                      <button
                        type="button"
                        onClick={addAdminEmail}
                        className="flex items-center text-purple-600 hover:text-purple-700 transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add another admin
                      </button>
                    )}
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-purple-500 mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium text-purple-700">Admin Privileges</p>
                        <p className="text-sm text-purple-600 mt-1">
                          Admins can create teams, manage projects, invite members, 
                          and access billing settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <button
                      onClick={() => handleSetStep(1)}
                      className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                    <button
                      onClick={() => handleSetStep(3)}
                      disabled={adminEmails.every(email => !email.trim())}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg flex items-center"
                    >
                      Continue
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="space-y-8 animate-slide-in-right">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-purple-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">
                      Ready to Launch! 🚀
                    </h2>
                    <p className="text-gray-600">
                      Review your setup before sending invitations
                    </p>
                  </div>
                  
                  {apiError && <OnboardingMessage type="error">{apiError}</OnboardingMessage>}

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-4">Setup Summary</h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between py-3 border-b border-gray-200">
                          <span className="text-gray-600">Company</span>
                          <span className="font-medium">{companyName}</span>
                        </div>
                        
                        <div className="flex justify-between py-3 border-b border-gray-200">
                          <span className="text-gray-600">Your Email</span>
                          <span className="font-medium">{yourEmail}</span>
                        </div>
                        
                        <div className="py-3">
                          <span className="text-gray-600 block mb-2">Admin Invitations</span>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {adminEmails.filter(e => e.trim()).map((email, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="font-medium text-gray-700">{email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
                        <div>
                          <p className="font-medium text-blue-700">What happens next?</p>
                          <ul className="text-sm text-blue-600 mt-2 space-y-1">
                            <li>• Admins receive email invitations with secure links</li>
                            <li>• You'll get access to create your first workspace</li>
                            <li>• After admins join, they can invite team members</li>
                            <li>• 14-day free trial starts immediately</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <button
                      onClick={() => handleSetStep(2)}
                      className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg flex items-center"
                    >
                      {loading ? (
                        <>
                          <Loader className="animate-spin w-5 h-5 mr-2" />
                          Sending Invites...
                        </>
                      ) : (
                        <>
                          Send Invitations
                          <UserPlus className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Success Screen */
            <div className="text-center py-12 animate-bounce-in">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-8 border-4 border-green-200 shadow-sm">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Invitations Sent! ✨
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                We've sent secure invitation links to all admins at <strong>{companyName}</strong>. 
                Check your inbox at <strong>{yourEmail}</strong> for your access link.
              </p>
              
              <div className="space-y-4 max-w-md mx-auto mb-10">
                <div className="flex items-center justify-center text-sm text-gray-500 bg-gray-50 py-2 rounded-lg border border-gray-100">
                  <Mail className="w-4 h-4 mr-2" />
                  <span>{adminEmails.filter(e => e.trim()).length} admin invitations sent</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 shadow-md"
                >
                  Check Your Email
                </Link>
                <Link
                  to="/"
                  className="px-8 py-3 bg-white text-gray-700 font-bold rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 shadow-sm"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyOnboarding;
import React, { useState } from 'react';
import { auth, isEmailAllowed, supabase } from '../../lib/supabase';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validate email domain
    if (!isEmailAllowed(email)) {
      setError('Alleen @merger.be e-mailadressen zijn toegestaan');
      setLoading(false);
      return;
    }

    try {
      if (isForgotPassword) {
        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check je e-mail voor een link om je wachtwoord te resetten!');
        }
      } else if (isSignUp) {
        const { data, error } = await auth.signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage('Check je e-mail om je account te bevestigen!');
        }
      } else {
        const { data, error } = await auth.signIn(email, password);
        if (error) {
          setError(error.message);
        } else if (data?.user) {
          onLogin(data.user);
        }
      }
    } catch (err) {
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
    }

    setLoading(false);
  };

  const resetForm = () => {
    setError('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🗄️ Keukenkast Configurator
          </h1>
          <p className="text-gray-600">
            {isForgotPassword
              ? 'Wachtwoord vergeten'
              : isSignUp
              ? 'Maak een account aan'
              : 'Log in om verder te gaan'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mailadres
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="naam@merger.be"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Alleen @merger.be e-mailadressen zijn toegestaan
            </p>
          </div>

          {/* Password field - hide for forgot password */}
          {!isForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Laden...
              </span>
            ) : isForgotPassword ? (
              'Verstuur reset link'
            ) : isSignUp ? (
              'Account aanmaken'
            ) : (
              'Inloggen'
            )}
          </button>
        </form>

        {/* Forgot password link - only show on login */}
        {!isSignUp && !isForgotPassword && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsForgotPassword(true);
                resetForm();
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Wachtwoord vergeten?
            </button>
          </div>
        )}

        {/* Toggle sign up / sign in / back to login */}
        <div className="mt-6 text-center">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                resetForm();
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Terug naar inloggen
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                resetForm();
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isSignUp
                ? 'Heb je al een account? Log in'
                : 'Nog geen account? Registreer'}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Merger.be - Keukenkast Configurator
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

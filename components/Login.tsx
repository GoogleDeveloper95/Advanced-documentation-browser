/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Bot, Key, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (apiKey: string, email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [apiKey, setApiKey] = useState('');
  const [email, setEmail] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim() || !email.trim()) {
      setError('Please enter both API key and email');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Test the API key by making a simple request
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
      
      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      // Save to localStorage
      localStorage.setItem('gemini_api_key', apiKey);
      localStorage.setItem('user_email', email);
      localStorage.setItem('has_logged_in', 'true');

      onLogin(apiKey, email);
    } catch (err) {
      setError('Invalid API key. Please check your key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-[#79B8FF] p-3 rounded-xl">
              <Bot size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Gemini Content Studio</h1>
          <p className="text-[#A8ABB4]">Enter your credentials to get started</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#1E1E1E] rounded-xl border border-[rgba(255,255,255,0.05)] p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#E2E2E2] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A8ABB4]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#E2E2E2] placeholder-[#777777] focus:ring-2 focus:ring-[#79B8FF] focus:border-[#79B8FF] transition-colors"
                  required
                />
              </div>
            </div>

            {/* API Key Field */}
            <div>
              <label className="block text-sm font-medium text-[#E2E2E2] mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <Key size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A8ABB4]" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full pl-10 pr-12 py-3 bg-[#2C2C2C] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#E2E2E2] placeholder-[#777777] focus:ring-2 focus:ring-[#79B8FF] focus:border-[#79B8FF] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A8ABB4] hover:text-white transition-colors"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !apiKey.trim() || !email.trim()}
              className="w-full bg-[#79B8FF] hover:bg-[#6BA3E8] disabled:bg-[#4A4A4A] disabled:text-[#777777] text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Get Started
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.1)]">
            <p className="text-xs text-[#A8ABB4] text-center">
              Don't have an API key?{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#79B8FF] hover:text-[#6BA3E8] underline"
              >
                Get one here
              </a>
            </p>
            <p className="text-xs text-[#777777] text-center mt-2">
              Your API key is stored locally and never shared
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

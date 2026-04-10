import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/auth-store';
import { useBranchStore } from '../../stores/branch-store';
import apiClient from '../../lib/api-client';
import { getErrorMessage } from '../../lib/error-utils';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const { setSelectedBranch } = useBranchStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const biometric = useBiometricAuth((path) => navigate(path, { replace: true }));

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const locationState = location.state as { from?: { pathname?: string } } | null;
      const defaultPath =
        user.role === 'cashier' || user.role === 'pharmacist'
          ? '/pos'
          : user.role === 'marketer'
            ? '/marketer/dashboard'
            : '/admin/dashboard';
      const from = locationState?.from?.pathname || defaultPath;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/auth/login', {
        username: username.trim(),
        password,
      });
      return response.data;
    },
    onSuccess: async (data) => {
      const { user, accessToken, refreshToken } = data;
      
      // Store tokens in auth store
      setAuth(user, accessToken, refreshToken);
      
      // Fetch and set user's branch if they have one
      if (user.branchId) {
        try {
          const branchResponse = await apiClient.get(`/branches/${user.branchId}`);
          setSelectedBranch(branchResponse.data);
        } catch (branchError) {
          console.error('Failed to fetch branch:', branchError);
        }
      }

      // If biometric is available but not yet enrolled, offer to enable it
      if (biometric.isAvailable && !biometric.isEnabled) {
        await biometric.promptToEnable(user.username, accessToken);
      }
      
      // Navigate to appropriate page based on role
      if (user.role === 'cashier' || user.role === 'pharmacist') {
        navigate('/pos');
      } else if (user.role === 'marketer') {
        navigate('/marketer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-darker">
      <div className="max-w-md w-full p-8 bg-primary-dark rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          Pharmacy POS
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Sign in to your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setFieldErrors((prev) => ({ ...prev, username: undefined }));
            }}
            error={fieldErrors.username}
            placeholder="Enter your username"
            required
            disabled={loginMutation.isPending}
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            placeholder="Enter your password"
            required
            disabled={loginMutation.isPending}
            autoComplete="current-password"
          />

          {loginMutation.isError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <p className="text-sm text-red-500">
                {getErrorMessage(loginMutation.error, 'Invalid username or password')}
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={loginMutation.isPending}
            disabled={loginMutation.isPending}
          >
            Sign In
          </Button>

          {biometric.isAvailable && biometric.isEnabled && (
            <button
              type="button"
              onClick={biometric.loginWithBiometric}
              disabled={biometric.isLoading || loginMutation.isPending}
              className="w-full flex flex-col items-center gap-1 py-3 rounded-lg border border-gray-600 text-gray-300 hover:border-blue-400 hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {biometric.isLoading ? (
                <span className="text-sm">Authenticating…</span>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8"
                  >
                    <path d="M12 2C8.5 2 5.5 4.5 5.5 8v1" />
                    <path d="M18.5 9c0-3.5-3-6.5-6.5-6.5" />
                    <path d="M12 8a4 4 0 0 1 4 4" />
                    <path d="M8 12a4 4 0 0 1 4-4" />
                    <path d="M12 16v.01" />
                    <path d="M12 12v.01" />
                    <ellipse cx="12" cy="12" rx="3" ry="3" />
                  </svg>
                  <span className="text-xs font-medium">Use Fingerprint</span>
                </>
              )}
            </button>
          )}

          {biometric.error && (
            <p className="text-xs text-red-400 text-center">{biometric.error}</p>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Contact your administrator for account access
          </p>
        </div>
      </div>
    </div>
  );
};

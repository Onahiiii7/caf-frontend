import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../lib/api-client';
import { useAuthStore } from '../stores/auth-store';
import { useBranchStore } from '../stores/branch-store';

interface MarketerLayoutProps {
  children: ReactNode;
  title?: string;
}

export const MarketerLayout = ({ children, title = 'Marketer Dashboard' }: MarketerLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { selectedBranch } = useBranchStore();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/marketer/dashboard',
    },
    {
      name: 'Review',
      path: '/marketer/review',
    },
    {
      name: 'Sell',
      path: '/marketer/sales',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">Pharmacy POS</h1>
            <p className="text-xs text-gray-500 truncate">
              {selectedBranch?.name || 'No branch selected'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline-block">
              {user?.firstName} {user?.lastName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <nav className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                } whitespace-nowrap shrink-0`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <main>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};
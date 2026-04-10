import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Users,
  CreditCard,
  Percent
} from 'lucide-react';

export function SalesPage() {
  const salesModules = [
    {
      title: 'POS Terminal',
      description: 'Process sales transactions at the point of sale',
      icon: CreditCard,
      path: '/pos',
      color: 'bg-green-500'
    },
    {
      title: 'Sales Reports',
      description: 'Analyze sales performance and trends',
      icon: TrendingUp,
      path: '/admin/reports/sales',
      color: 'bg-blue-500'
    },
    {
      title: 'Transactions',
      description: 'View transaction history and details',
      icon: FileText,
      path: '/pos/transactions',
      color: 'bg-purple-500'
    },
    {
      title: 'Customer Reports',
      description: 'Track customer purchase patterns',
      icon: Users,
      path: '/admin/reports/customers',
      color: 'bg-orange-500'
    },
    {
      title: 'Promotions',
      description: 'Manage discounts and promotional campaigns',
      icon: Percent,
      path: '/admin/promotions',
      color: 'bg-pink-500'
    },
    {
      title: 'Shift Management',
      description: 'Monitor cashier shifts and daily summaries',
      icon: DollarSign,
      path: '/pos/shifts',
      color: 'bg-teal-500'
    }
  ];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Sales Management</h1>
          <p className="mt-2 text-gray-400">
            Process transactions, analyze sales performance, and manage customer relationships
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.path}
                to={module.path}
                className="block group"
              >
                <div className="bg-primary-dark/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 hover:border-accent-green/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)] transition-all duration-300 h-full">
                  <div className="flex items-start space-x-4">
                    <div className={`${module.color} bg-opacity-10 rounded-xl p-3 text-white group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-accent-green transition-colors">
                        {module.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="bg-green-500/10 rounded-2xl p-6 border border-green-500/20 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
            Sales Best Practices
          </h3>
          <ul className="space-y-3 text-sm text-green-200/80">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Start and end shifts properly to maintain accurate cash records
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Verify customer information for loyalty program benefits
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Apply promotions correctly to ensure customer satisfaction
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Review daily sales reports to track performance goals
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

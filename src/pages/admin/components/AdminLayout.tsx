// src/pages/admin/components/AdminLayout.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  AlertTriangle,
  BarChart3,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

interface NavItem {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  count?: number;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeSection = 'dashboard',
  onSectionChange = () => {}
}) => {
  const { user, signOut } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Start open on desktop
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'მთავარი' },
    { id: 'products', icon: Package, label: 'პროდუქტები' },
    { id: 'orders', icon: ShoppingBag, label: 'შეკვეთები' },
    { id: 'inventory', icon: AlertTriangle, label: 'მარაგი' },
    { id: 'analytics', icon: BarChart3, label: 'ანალიტიკა' },
  ];

  const SidebarNavItem: React.FC<NavItem & { isActive: boolean; onClick: () => void }> = ({
    icon: Icon,
    label,
    count,
    isActive,
    onClick
  }) => (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {count && (
        <span className={`
          px-2 py-1 text-xs rounded-full
          ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}
        `}>
          {count}
        </span>
      )}
    </button>
  );

  const currentTime = new Date().toLocaleTimeString('ka-GE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'დილა მშვიდობისა' : currentHour < 18 ? 'დღე მშვიდობისა' : 'საღამო მშვიდობისა';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Logo/Brand */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">LifeStore</h1>
              <p className="text-xs text-gray-500">ადმინისტრაციული პანელი</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              {...item}
              isActive={activeSection === item.id}
              onClick={() => {
                onSectionChange(item.id);
                setIsMobileMenuOpen(false);
              }}
            />
          ))}
        </nav>

        {/* Mobile User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || 'ადმინისტრატორი'}
                </p>
                <p className="text-xs text-gray-500">{currentTime}</p>
              </div>
            </div>
            <button
              onClick={() => {
                console.log("🚪 Logging out...");
                signOut();
              }}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>გასვლა</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={`
          hidden lg:flex flex-col
          ${isSidebarOpen ? 'w-64' : 'w-16'}
          bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out h-screen
        `}>
          {/* Desktop Logo/Brand */}
          <div className="p-4 border-b border-gray-200">
            {isSidebarOpen ? (
              <div>
                <h1 className="text-lg font-bold text-gray-900">LifeStore</h1>
                <p className="text-xs text-gray-500">ადმინისტრაციული პანელი</p>
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LS</span>
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigationItems.map((item) => (
              <SidebarNavItem
                key={item.id}
                {...item}
                isActive={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              />
            ))}
          </nav>

          {/* Desktop User Profile */}
          <div className="p-4 border-t border-gray-200">
            {isSidebarOpen ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.email || 'ადმინისტრატორი'}
                    </p>
                    <p className="text-xs text-gray-500">{currentTime}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log("🚪 Logging out...");
                    signOut();
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>გასვლა</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    console.log("🚪 Logging out...");
                    signOut();
                  }}
                  className="w-full p-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                  title="გასვლა"
                >
                  <LogOut className="w-4 h-4 mx-auto" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Top Header Bar */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200 lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Sidebar Toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              <div className="min-w-0">
                <h1 className="text-base lg:text-lg font-semibold text-gray-900 capitalize truncate">
                  {activeSection === 'dashboard' ? 'მთავარი გვერდი' :
                   activeSection === 'products' ? 'პროდუქტები' :
                   activeSection === 'orders' ? 'შეკვეთები' :
                   activeSection === 'inventory' ? 'მარაგი' :
                   activeSection === 'analytics' ? 'ანალიტიკა' : activeSection}
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 truncate hidden sm:block">
                  {greeting}, {user?.email || 'ადმინისტრატორი'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4">
              <span className="text-xs lg:text-sm text-gray-500">{currentTime}</span>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
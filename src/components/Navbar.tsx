import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from 'antd';
import { ShoppingCart, Menu, X, ShieldCheck, User, LogOut, LogIn } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import AuthButton from './auth/AuthButton';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCartStore();
  const { user, signInWithGoogle, signOut } = useAuthStore();

  const isActivePath = (path: string) => location.pathname === path;

  // როდესაც როუტი იცვლება, მობილური მენიუ დაიკეტოს
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // მობილური მენიუსთვის: Scroll-ის გათიშვა როცა მენიუ ღიაა
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const handleMobileSignIn = async () => {
    await signInWithGoogle();
    setIsMenuOpen(false);
  };

  const handleMobileSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white/90 backdrop-blur-lg sticky top-0 z-50 border-b border-stone-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group z-50">
              <div className="relative overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                  <img
                  src="/Screenshot 2025-12-10 151703.png" // დარწმუნდი რომ ეს ფაილი არსებობს public-ში
                  alt="LifeStore"
                  className="h-10 w-auto object-cover"
                  />
              </div>
              <span className="text-xl font-bold text-stone-800 tracking-tight group-hover:text-emerald-700 transition-colors">
                LifeStore
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <NavLink to="/" isActive={isActivePath('/')}>მთავარი</NavLink>
              <NavLink to="/products" isActive={isActivePath('/products')}>პროდუქტები</NavLink>
              <NavLink to="/about" isActive={isActivePath('/about')}>ჩვენს შესახებ</NavLink>
              
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                    isActivePath('/admin')
                      ? 'bg-orange-100 text-orange-700 shadow-sm'
                      : 'text-stone-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Desktop Auth Button (Dropdown) */}
              <div className="hidden lg:block">
                  <AuthButton />
              </div>

              {/* Cart Icon */}
              <Link to="/cart" className="group relative mr-2 lg:mr-0">
                <Badge count={totalItems} size="small" color="#10b981" offset={[-4, 4]}>
                  <div className="p-2.5 bg-stone-50 rounded-full text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-200 border border-transparent group-hover:border-emerald-100">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </Badge>
              </Link>

              {/* Mobile Menu Toggle Button */}
              <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2.5 text-stone-600 hover:bg-stone-100 rounded-xl transition-colors active:scale-95 z-50"
                  aria-label="Menu"
              >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay & Drawer */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
            isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Content */}
        <div className={`absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl transition-transform duration-300 ease-out transform ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
            <div className="flex flex-col h-full pt-24 px-6 pb-8 overflow-y-auto">
                
                {/* Mobile Links */}
                <div className="space-y-2 mb-8">
                    <MobileNavLink to="/" isActive={isActivePath('/')} onClick={() => setIsMenuOpen(false)}>მთავარი</MobileNavLink>
                    <MobileNavLink to="/products" isActive={isActivePath('/products')} onClick={() => setIsMenuOpen(false)}>პროდუქტები</MobileNavLink>
                    <MobileNavLink to="/about" isActive={isActivePath('/about')} onClick={() => setIsMenuOpen(false)}>ჩვენს შესახებ</MobileNavLink>
                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-orange-50 text-orange-700 font-bold mt-2"
                        >
                            <ShieldCheck className="w-5 h-5" />
                            Admin Panel
                        </Link>
                    )}
                </div>

                {/* Mobile Auth Section (At the bottom) */}
                <div className="mt-auto pt-6 border-t border-gray-100">
                    {user ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
                                    {user.displayName?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-bold text-stone-900">{user.displayName || 'მომხმარებელი'}</p>
                                    <p className="text-xs text-stone-500 truncate max-w-[180px]">{user.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleMobileSignOut}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-stone-100 text-stone-700 font-medium rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                გასვლა
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={handleMobileSignIn}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-stone-900 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95"
                        >
                            <LogIn className="w-5 h-5" />
                            შესვლა / რეგისტრაცია
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

// Helper Components
const NavLink = ({ to, isActive, children }: { to: string, isActive: boolean, children: React.ReactNode }) => (
    <Link
        to={to}
        className={`text-sm font-medium transition-all duration-200 relative py-1 px-1 ${
            isActive ? 'text-stone-900 font-bold' : 'text-stone-500 hover:text-stone-900'
        }`}
    >
        {children}
        {isActive && (
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-emerald-500 rounded-full" />
        )}
    </Link>
);

const MobileNavLink = ({ to, isActive, children, onClick }: { to: string, isActive: boolean, children: React.ReactNode, onClick: () => void }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`block px-4 py-3.5 rounded-xl text-lg font-medium transition-all ${
            isActive 
            ? 'bg-stone-50 text-stone-900 font-bold' 
            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
        }`}
    >
        {children}
    </Link>
);

export default Navbar;
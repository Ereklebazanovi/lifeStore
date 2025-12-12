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
    setIsMenuOpen(false); // ჯერ მენიუ დავხუროთ, რომ pop-up გამოჩნდეს
    await signInWithGoogle();
  };

  const handleMobileSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-lg sticky top-0 z-50 border-b border-stone-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group z-50">
              <div className="relative overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                  <img
                  src="/Screenshot 2025-12-10 151703.png" 
                  alt="LifeStore"
                  className="h-10 w-auto object-cover"
                  />
              </div>
              <span className="text-xl font-bold text-stone-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                LifeStore
              </span>
            </Link>

            {/* Desktop Navigation (Visible on Tablet and Desktop) */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
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
              {/* Desktop Auth Button (Visible on Tablet and Desktop) */}
              <div className="hidden md:block">
                  <AuthButton />
              </div>

              {/* Cart Icon */}
              <Link to="/cart" className="group relative mr-1">
                <Badge count={totalItems} size="small" color="#10b981" offset={[-4, 4]}>
                  <div className="p-2.5 bg-stone-50 rounded-full text-stone-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-all duration-200 border border-stone-100 group-hover:border-emerald-100">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </Badge>
              </Link>

              {/* Mobile Menu Toggle Button (Hidden on Tablet+) */}
              <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2.5 text-stone-700 hover:bg-stone-100 rounded-xl transition-colors active:scale-95 z-50 ml-2"
                  aria-label="Menu"
              >
                  {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay & Drawer */}
      <div 
        className={`fixed inset-0 z-[60] md:hidden transition-all duration-300 ${
            isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Content (Drawer) */}
        <div className={`absolute top-0 right-0 w-[85%] max-w-sm h-full bg-white shadow-2xl transition-transform duration-300 ease-out transform ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center px-6 h-24 border-b border-stone-100 bg-stone-50/50">
                <span className="text-2xl font-bold text-stone-900 tracking-tight">LifeStore</span>
                <button 
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 bg-white rounded-full shadow-sm text-stone-500 hover:text-red-500 transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            <div className="flex flex-col h-full pt-8 px-6 pb-8 overflow-y-auto">
                
                {/* Mobile Links */}
                <div className="space-y-3 mb-8">
                    <MobileNavLink to="/" isActive={isActivePath('/')} onClick={() => setIsMenuOpen(false)}>მთავარი</MobileNavLink>
                    <MobileNavLink to="/products" isActive={isActivePath('/products')} onClick={() => setIsMenuOpen(false)}>პროდუქტები</MobileNavLink>
                    <MobileNavLink to="/about" isActive={isActivePath('/about')} onClick={() => setIsMenuOpen(false)}>ჩვენს შესახებ</MobileNavLink>
                    
                    {user?.role === 'admin' && (
                        <Link
                            to="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-orange-50 text-orange-800 font-bold border border-orange-100 mt-4"
                        >
                            <ShieldCheck className="w-6 h-6" />
                            ადმინ პანელი
                        </Link>
                    )}
                </div>

                {/* Mobile Auth Section (At the bottom) */}
                <div className="mt-auto">
                    {user ? (
                        <div className="bg-stone-50 p-5 rounded-3xl border border-stone-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                                    {user.displayName?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-stone-900 text-lg truncate">{user.displayName || 'მომხმარებელი'}</p>
                                    <p className="text-sm text-stone-500 truncate">{user.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleMobileSignOut}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-stone-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-colors shadow-sm"
                            >
                                <LogOut className="w-5 h-5" />
                                გასვლა
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-center text-stone-500 text-sm">სრული წვდომისთვის გაიარეთ ავტორიზაცია</p>
                            <button 
                                onClick={handleMobileSignIn}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-stone-900 text-white font-bold rounded-2xl text-lg shadow-lg active:scale-95 transition-transform"
                            >
                                <LogIn className="w-6 h-6" />
                                შესვლა / რეგისტრაცია
                            </button>
                        </div>
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
        className={`text-sm font-bold transition-all duration-200 relative py-1 px-2 rounded-lg ${
            isActive 
            ? 'text-emerald-700 bg-emerald-50' 
            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
        }`}
    >
        {children}
    </Link>
);

const MobileNavLink = ({ to, isActive, children, onClick }: { to: string, isActive: boolean, children: React.ReactNode, onClick: () => void }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`block px-5 py-4 rounded-2xl text-xl font-bold transition-all ${
            isActive 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 shadow-sm' 
            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900 border border-transparent'
        }`}
    >
        {children}
    </Link>
);

export default Navbar;
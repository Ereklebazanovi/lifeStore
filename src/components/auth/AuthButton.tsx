import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  LogOut,
  Shield,
  User,
  LogIn,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const AuthButton: React.FC = () => {
  const { user, isLoading, signInWithGoogle, signOut } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    if (isLoading) return; // თუ უკვე იტვირთება, აღარ დააჭერინოს
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    if (isLoading) return;
    setIsDropdownOpen(false);
    await signOut();
  };

  // ამოვიღეთ ის კოდი, რომელიც ღილაკს აქრობდა (if isLoading return...)

  // --- LOGGED IN STATE ---
  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white border border-stone-200 rounded-full hover:shadow-md hover:border-emerald-200 transition-all duration-200 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {/* აქაც, თუ იტვირთება, ფოტოს მაგივრად ლოადერს ვაჩვენებთ, მაგრამ ღილაკი რჩება */}
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm overflow-hidden">
              <span className="text-sm font-bold">
                {user.displayName?.[0]?.toUpperCase() || (
                  <User className="w-4 h-4" />
                )}
              </span>
            </div>
          )}

          <span className="text-sm font-medium text-stone-700 max-w-[100px] truncate hidden xl:block group-hover:text-stone-900">
            {user.displayName?.split(" ")[0] || "Profile"}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <div
          className={`absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-stone-100 transform transition-all duration-200 origin-top-right z-50 ${
            isDropdownOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="p-4 border-b border-stone-100">
            <p className="text-sm font-bold text-stone-900 truncate">
              {user.displayName || "User"}
            </p>
            <p className="text-xs text-stone-500 truncate mt-0.5">
              {user.email}
            </p>

            {user.role === "admin" && (
              <div className="mt-3 flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit">
                <Shield className="w-3 h-3" />
                ადმინისტრატორი
              </div>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              გასვლა
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGGED OUT STATE ---
  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-stone-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>იტვირთება...</span>
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          <span>შესვლა</span>
        </>
      )}
    </button>
  );
};

export default AuthButton;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, MessageSquare, Settings, User, Home, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const location = useLocation();

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chatverse</h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {authUser ? (
              <>
                {/* Authenticated User Navigation */}
                <Link
                  to="/"
                  className={`btn btn-sm btn-ghost gap-2 ${
                    location.pathname === "/" ? "bg-base-200" : ""
                  }`}
                >
                  <Home className="size-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>

                {/* <Link
                  to="/dashboard"
                  className={`btn btn-sm btn-ghost gap-2 ${
                    location.pathname === "/dashboard" ? "bg-base-200" : ""
                  }`}
                >
                  <LayoutDashboard className="size-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link> */}

                <Link
                  to="/settings"
                  className={`btn btn-sm btn-ghost gap-2 ${
                    location.pathname === "/settings" ? "bg-base-200" : ""
                  }`}
                >
                  <Settings className="size-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>

                <Link
                  to="/profile"
                  className={`btn btn-sm btn-ghost gap-2 ${
                    location.pathname === "/profile" ? "bg-base-200" : ""
                  }`}
                >
                  <User className="size-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button 
                  className="btn btn-sm btn-ghost gap-2" 
                  onClick={logout}
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Non-authenticated User Navigation */}
                <Link
                  to="/"
                  className={`btn btn-sm btn-ghost ${
                    location.pathname === "/" ? "bg-base-200" : ""
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className={`btn btn-sm btn-ghost ${
                    location.pathname === "/login" ? "bg-base-200" : ""
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-sm btn-primary"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
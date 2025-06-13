// LoginPage.jsx
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();
  
  const validateForm = () => {
    if (formData.email === "") {
      toast.error("Email is required");
      return false;
    }
    if (formData.password === "") {
      toast.error("Password is required");
      return false;
    }
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    login(formData);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center space-y-6">
            {/* Large Logo */}
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                <MessageSquare className="w-12 h-12 text-white" />
                <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            
            {/* Brand Text */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Chatverse
              </h1>
              <p className="text-xl text-purple-100">
                Connect, chat, and create memories with people around the world
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-3 text-left max-w-sm">
              <div className="flex items-center gap-3 text-purple-100">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Real-time messaging</span>
              </div>
              <div className="flex items-center gap-3 text-purple-100">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                <span>Secure conversations</span>
              </div>
              <div className="flex items-center gap-3 text-purple-100">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse delay-700"></div>
                <span>Share media & files</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-12">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Chatverse</h1>
          </div>

          {/* Login Card */}
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to your account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
  <label className="text-sm font-semibold text-gray-700">Password</label>
  <div className="relative group">
    {/* Lock Icon */}
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
    </div>

    {/* Password Input */}
    <input
      type={showPassword ? "text" : "password"}
      className="w-full pl-12 pr-12 py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 text-gray-900"
      placeholder="••••••••"
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
    />

    {/* Toggle Visibility */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-0 inset-y-0 px-4 flex items-center bg-transparent rounded-r-xl focus:outline-none"
    >
      {showPassword ? (
        <EyeOff className="h-5 w-5 text-gray-500 hover:text-purple-600 transition-colors" />
      ) : (
        <Eye className="h-5 w-5 text-gray-500 hover:text-purple-600 transition-colors" />
      )}
    </button>
  </div>
</div>



                {/* Login Button */}
                <button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <div className="px-4 text-sm text-gray-500">or</div>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link 
                    to="/signup" 
                    className="font-semibold text-purple-600 hover:text-purple-700 transition-colors hover:underline"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/70 text-sm">
                Secure, private, and always free
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute top-1/2 right-10 w-3 h-3 bg-purple-300/30 rounded-full animate-bounce delay-2000"></div>
      <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-blue-300/40 rounded-full animate-bounce"></div>
    </div>
  );
};

export default LoginPage;
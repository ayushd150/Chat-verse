import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare, User, Sparkles, UserPlus, Shield, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";



const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Invalid email");
      return false;
    }
    if (!formData.password.trim()) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const isValid = validateForm();
  if (isValid) {
    try {
      await signup(formData);
      // Redirect to login page after successful signup
      navigate('/login');
    } catch (error) {
      // Error is already handled in the signup function with toast
      console.log('Signup failed:', error);
    }
  }
};

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900">
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-500/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
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
                <UserPlus className="w-6 h-6 text-emerald-300 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
            
            {/* Brand Text */}
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                Join Chatverse
              </h1>
              <p className="text-xl text-emerald-100">
                Start your journey with our amazing community of chatters
              </p>
            </div>
            
            {/* Features */}
            <div className="space-y-3 text-left max-w-sm">
              <div className="flex items-center gap-3 text-emerald-100">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>Join millions of users</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse delay-300"></div>
                <span>Protected by encryption</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-700"></div>
                <span>Always free to use</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - SignUp Form */}
        <div className="flex flex-col justify-center items-center p-6 sm:p-12">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 mx-auto bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Join Chatverse</h1>
          </div>

          {/* SignUp Card */}
          <div className="w-full max-w-md">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
                <p className="text-gray-600">Get started with your free account</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name Input */}
                <div className="space-y-2">
  <label className="text-sm font-semibold text-gray-700">Full Name</label>
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <User className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
    </div>
    <input
      type="text"
      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl 
                 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                 transition-all duration-200 placeholder-gray-400 text-gray-800"
      placeholder="John Doe"
      value={formData.fullName}
      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
    />
  </div>
</div>
                {/* Email Input */}
                {/* Email Input */}
<div className="space-y-2">
  <label className="text-sm font-semibold text-gray-700">Email</label>
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
    </div>
    <input
      type="email"
      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl 
                 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                 transition-all duration-200 placeholder-gray-400 text-gray-800"
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
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
    </div>
    <input
      type={showPassword ? "text" : "password"}
      className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl 
                 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
                 transition-all duration-200 placeholder-gray-400 text-gray-800"
      placeholder="••••••••"
      value={formData.password}
      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
    />
    <button
      type="button"
      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl px-2 transition-colors"
      onClick={() => setShowPassword(!showPassword)}
    >
      {showPassword ? (
        <EyeOff className="h-5 w-5 text-gray-500" />
      ) : (
        <Eye className="h-5 w-5 text-gray-500" />
      )}
    </button>
  </div>
</div>


                {/* SignUp Button */}
                <button 
                  type="submit" 
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isSigningUp}
                >
                  {isSigningUp ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <div className="px-4 text-sm text-gray-500">or</div>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link 
                    to="/login" 
                    className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/70 text-sm">
                By signing up, you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Animation Elements */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute top-1/2 right-10 w-3 h-3 bg-emerald-300/30 rounded-full animate-bounce delay-2000"></div>
      <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-teal-300/40 rounded-full animate-bounce"></div>
    </div>
  );
};

export default SignUpPage;
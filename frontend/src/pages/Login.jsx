import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password);
        setIsSubmitting(false);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header
            <header className="w-full px-8 py-6 flex justify-between items-center bg-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent italic tracking-tighter">
                        CollabNotes
                    </span>
                </div>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md active:scale-95">
                    Sign Up
                </Link>
            </header> */}

            <div className="flex-1 flex flex-col md:flex-row-reverse shadow-2xl overflow-hidden m-0 md:m-0  border border-slate-100">
                {/* Left Side: Illustration / Welcome */}
                <div className="hidden md:flex flex-1 bg-[#0f172a] p-16 flex-col items-center justify-center text-center relative overflow-hidden group">
                    {/* Abstract background shapes */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />

                    <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                        <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                            Welcome Back.
                        </h2>
                        <p className="text-slate-400 text-xl max-w-sm mx-auto leading-relaxed">
                            Access your personal knowledge base and collaborate with your team with ease.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 bg-white p-8 md:p-10 flex flex-col justify-center items-center">
                    <div className="w-full max-w-sm">
                        <div className="mb-10 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                    placeholder="nis@gmail.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-slate-500 mt-5 text-sm font-medium">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline underline-offset-4">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

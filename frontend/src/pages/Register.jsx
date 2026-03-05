import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';


const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const { register, error } = useAuth();
    const navigate = useNavigate();

    const { name, email, password, confirmPassword } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        const success = await register(name, email, password);
        setIsSubmitting(false);
        if (success) {
            navigate('/');
        }
    };

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            {/* Header
            <header className="w-full px-8 py-4 flex justify-between items-center bg-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent italic tracking-tighter">
                        CollabNotes
                    </span>
                </div>
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4">
                    Sign In
                </Link>
            </header> */}

            <div className="flex-1 flex flex-col md:flex-row-reverse shadow-2xl overflow-hidden m-0 md:m-0 border border-slate-100">
                {/* Left Side: Illustration / Welcome */}
                <div className="hidden md:flex flex-1 bg-[#0f172a] p-16 flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-90 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />

                    <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
                        <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                            Think. Create. Share.
                        </h2>
                        <p className="text-slate-400 text-xl max-w-sm leading-relaxed">
                            Join the community of collaborative note-takers and turn your ideas into reality.
                        </p>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 bg-white p-6 md:p-10 flex flex-col justify-center items-center overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-sm">
                        <div className="mb-8 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
                        </div>

                        {(error || localError) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium"
                            >
                                {error || localError}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={onChange}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                    placeholder="••••••••"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={onChange}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-500/25 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 mt-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <span>Create Account</span>
                                )}
                            </button>
                        </form>

                        <p className="text-center text-slate-500 mt-4 text-sm font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline underline-offset-4">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;

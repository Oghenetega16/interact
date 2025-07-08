import { useState } from 'react';
import { Brain, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {

    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen bg-cyan-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl p-8 shadow-2xl my-10">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-2 bg-cyan-950 rounded-xl mr-3"><Brain className="w-6 h-6 text-white" /></div>
                            <h2 className="text-2xl font-bold">Interact</h2>
                        </div>
                        <p className="text-gray-300">Welcome back! Sign in to continue your coding journey.</p>
                    </div>

                    <form className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    className="w-full pl-12 pr-4 py-3 bg-cyan-950 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5 cursor-pointer" /> : <Eye className="w-5 h-5 cursor-pointer" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input type="checkbox" className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer" />
                                <span className="ml-2 text-sm text-gray-300">Remember me</span>
                            </label>
                            <Link to="/forgotpassword" className="text-sm text-cyan-950 hover:text-purple-300 cursor-pointer">Forgot password?</Link>
                        </div>

                        <button type="submit" className="w-full py-3 bg-cyan-950 hover:bg-cyan-900 text-white rounded-xl font-semibold transition-colors cursor-pointer"> Sign In</button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/20"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-full py-3 mb-5 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <FcGoogle className="w-5 h-5 mr-2" />
                            Sign in with Google
                        </button>
                    </form>

                    <Link to="/signup" className="text-center text-gray-300 mt-6 block">
                        Don't have an account?{' '}
                        <button className="text-cyan-950 hover:text-cyan-900 font-semibold cursor-pointer">
                            Sign up
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

import { useState } from 'react';
import { Brain, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaHandshake } from 'react-icons/fa';
import useChatStore from "./chatStore";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // For now, simulate a successful login
            // Replace this with your actual authentication logic
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock successful login response
            const mockUser = {
                id: '1',
                email: formData.email,
                fullName: 'John Doe',
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                token: 'mock-jwt-token-' + Date.now()
            };

            // Update store with user data (this automatically sets isAuthenticated to true)
            useChatStore.getState().setCurrentUser(mockUser);
            
            console.log('Login successful:', mockUser);

            // TODO: Replace the above mock code with your actual API call:
            /*
            const response = await fetch('YOUR_LOGIN_API_ENDPOINT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Successful login - update store
                useChatStore.getState().setCurrentUser(data.user);
            } else {
                setError(data.message || 'Login failed. Please try again.');
            }
            */
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Implement Google OAuth login
        console.log('Google login not implemented yet');
        setError('Google login not implemented yet');
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-gray-950 via-cyan-900 to-cyan-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white text-black rounded-2xl p-8 shadow-2xl my-10">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-2 bg-cyan-950 rounded-xl mr-3">
                                <FaHandshake className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl text-cyan-950 font-bold">Interact</h2>
                        </div>
                        <p className="">Welcome back! Start chatting and stay connected.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-950 focus:border-transparent"
                                    placeholder="Enter your email"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-950 focus:border-transparent"
                                    placeholder="Enter your password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 cursor-pointer" />
                                    ) : (
                                        <Eye className="w-5 h-5 cursor-pointer" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="rounded accent-cyan-950 border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer" 
                                    disabled={isLoading}
                                />
                                <span className="ml-2 text-sm">Remember me</span>
                            </label>
                            <Link 
                                to="/forgotpassword" 
                                className="text-sm text-cyan-950 hover:text-gray-600 cursor-pointer"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-3 bg-cyan-950 hover:bg-cyan-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full py-3 mb-5 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                        >
                            <FcGoogle className="w-5 h-5 mr-2" />
                            Sign in with Google
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <span className="text-gray-600">Don't have an account?</span>{' '}
                        <Link 
                            to="/signup" 
                            className="text-cyan-950 hover:text-cyan-900 font-semibold cursor-pointer"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
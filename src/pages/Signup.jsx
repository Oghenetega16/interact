import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, AtSign } from "lucide-react";
import { Link } from "react-router-dom";
import { FaHandshake } from 'react-icons/fa';
import useChatStore from "../store/chatStore";

export default function Signup() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setUserData((prev) => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        // Basic validation
        if (!userData.fullName.trim()) {
            setError('Full name is required');
            return false;
        }
        if (!userData.username.trim()) {
            setError('Username is required');
            return false;
        }
        if (userData.username.length < 3) {
            setError('Username must be at least 3 characters long');
            return false;
        }
        if (!userData.email.trim()) {
            setError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(userData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (!userData.password) {
            setError('Password is required');
            return false;
        }
        if (userData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (userData.password !== userData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // For now, simulate a successful signup
            // Replace this with your actual registration logic
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock successful signup response
            const newUser = {
                id: Date.now().toString(),
                email: userData.email,
                fullName: userData.fullName,
                username: userData.username,
                image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=0891b2&color=fff&size=150`,
                token: 'mock-jwt-token-' + Date.now()
            };

            // Update store with user data (this automatically sets isAuthenticated to true)
            useChatStore.getState().setCurrentUser(newUser);
            
            console.log('Signup successful:', newUser);

            // TODO: Replace the above mock code with your actual API call:
            /*
            const response = await fetch('YOUR_SIGNUP_API_ENDPOINT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: userData.fullName,
                    username: userData.username,
                    email: userData.email,
                    password: userData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Successful signup - update store
                useChatStore.getState().setCurrentUser(data.user);
            } else {
                setError(data.message || 'Registration failed. Please try again.');
            }
            */
        } catch (error) {
            console.error('Signup error:', error);
            setError('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                        <p className="">Join the conversation &mdash; it all starts with a hello.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={userData.fullName}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-950 focus:border-transparent"
                                    placeholder="Enter your full name"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Username</label>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={userData.username}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-950 focus:border-transparent"
                                    placeholder="Choose a username"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={userData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-950 focus:border-transparent"
                                    placeholder="Enter your email"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={userData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-950 focus:border-transparent"
                                    placeholder="Create a password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    aria-label="Toggle password visibility"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 cursor-pointer" />
                                    ) : (
                                        <Eye className="w-5 h-5 cursor-pointer" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Password must be at least 6 characters long
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={userData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-950 focus:border-transparent"
                                    placeholder="Confirm your password"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    aria-label="Toggle confirm password visibility"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5 cursor-pointer" />
                                    ) : (
                                        <Eye className="w-5 h-5 cursor-pointer" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-cyan-950 hover:bg-cyan-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors cursor-pointer flex items-center justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>
                    
                    <div className="text-center mt-6">
                        <span className="text-gray-600">Already have an account?</span>{' '}
                        <Link 
                            to="/login" 
                            className="text-cyan-950 hover:text-cyan-900 font-semibold cursor-pointer"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
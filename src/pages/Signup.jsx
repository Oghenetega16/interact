import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, AtSign } from "lucide-react";
import { Link } from "react-router-dom";
import { FaHandshake } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase"; 
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function Signup({ onVerificationRequired }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState('');
    const [firebaseError, setFirebaseError] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const navigate = useNavigate();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.username.trim()) newErrors.username = "Username is required";

        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!emailRegex.test(formData.email)) newErrors.email = "Email is invalid";

        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

        if (!formData.confirmPassword)
        newErrors.confirmPassword = "Please confirm your password";
        else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFirebaseError(null);
        const validationErrors = validate();
        setErrors(validationErrors);
    
        if (Object.keys(validationErrors).length === 0) {
        setIsLoading(true);
        try {
            console.log('Creating user...');
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            
            console.log('User created:', user.uid);
            console.log('Auth state:', user.uid ? 'Authenticated' : 'Not authenticated');
    
            // Add a small delay to ensure auth state is properly set
            await new Promise(resolve => setTimeout(resolve, 100));
    
            console.log('Attempting to write to Firestore...');
            await setDoc(doc(db, "users", user.uid), {
            fullName: formData.fullName,
            username: formData.username,
            email: formData.email,
            createdAt: new Date().toISOString()
            });
            
            console.log('Firestore write successful');
    
            await sendEmailVerification(user);
            toast.success("Verification email sent! Check your inbox.");
            
            // Use callback if provided, otherwise navigate directly
            if (onVerificationRequired) {
            onVerificationRequired(formData.email);
            } else {
            navigate("/email-verification", { 
                state: { email: formData.email } 
            });
            }
        } catch (error) {
            console.error('Full error object:', error);
            
            if (error instanceof FirebaseError) {
            console.error("Firebase error:", error.code, error.message);
    
            let message = "An unexpected error occurred.";
            switch (error.code) {
                case "auth/email-already-in-use":
                message = "This email is already registered. Try logging in.";
                break;
                case "auth/invalid-email":
                message = "Email address is invalid.";
                break;
                case "auth/weak-password":
                message = "Password must be at least 6 characters.";
                break;
                case "permission-denied":
                message = "Permission denied. Please try again.";
                break;
                case "unavailable":
                message = "Service temporarily unavailable. Please try again.";
                break;
            }
    
            setFirebaseError(message);
            } else {
            console.error("Unexpected error:", error);
            setFirebaseError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
        }
    };

    const ErrorMsg = ({ message }) =>
        message ? <p className="mt-1 text-xs text-red-500">{message}</p> : null;

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

                    {errors && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors}</p>
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
                                    value={formData.fullName}
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
                                    value={formData.username}
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
                                    value={formData.email}
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
                                    value={formData.password}
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
                                    value={formData.confirmPassword}
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
                        {firebaseError && <p className="mt-4 text-sm text-red-400 text-center">{firebaseError}</p>}
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
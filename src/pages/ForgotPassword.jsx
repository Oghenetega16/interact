import { useState } from "react";
import { Mail } from "lucide-react";
import { FaHandshake } from 'react-icons/fa';
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase"; 
import { FirebaseError } from "firebase/app";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg("");
        setErrorMsg("");

        if (!email.trim()) {
            setErrorMsg("Email is required");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMsg("A reset link has been sent to your email.");
        } catch (error) {
            if (error instanceof FirebaseError) {
                setErrorMsg(error.message);
            } else {
                setErrorMsg("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-montserrat">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-2 bg-cyan-950 rounded-xl mr-3">
                                <FaHandshake className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl text-cyan-950 font-bold">Interact</h2>
                        </div>
                        <p className="text-black">Enter your email to receive a reset link.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-500 rounded-xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mb-5 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>

                        {successMsg && <p className="text-green-400 text-sm text-center mt-2">{successMsg}</p>}
                        {errorMsg && <p className="text-red-500 text-sm text-center mt-2">{errorMsg}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}


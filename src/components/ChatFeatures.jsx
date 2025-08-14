import { useState } from "react";
import { FaHandshake } from "react-icons/fa";
import { MessageSquare, CircleDotDashed, Phone, ArchiveX, Settings, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import useChatStore from "../store/chatStore";

const iconMap = { MessageSquare, CircleDotDashed, Phone, ArchiveX, Settings, LogOut };

export default function ChatFeatures() {
    const navigate = useNavigate();
    const { setCurrentUser, activeTab, setActiveTab } = useChatStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;
        
        try {
            setIsLoggingOut(true);
            await signOut(auth);
            setCurrentUser(null);
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
            // You might want to show a toast notification here
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleFeatureClick = (id) => {
        if (id === "logout") {
            handleLogout();
            return;
        }
        
        // Set active tab in store for other components to use
        setActiveTab(id);
        
        // Handle other features based on id
        switch (id) {
            case "chat":
                // Already in chat view - maybe reset to main chat list
                break;
            case "status":
                // Show status/stories view
                break;
            case "calls":
                // Show calls history
                break;
            case "archive":
                // Show archived chats
                break;
            case "settings":
                // Navigate to settings or open settings modal
                break;
            default:
                break;
        }
    };

    const icons = [
        { id: "chat", label: "Chat", icon: "MessageSquare" },
        { id: "status", label: "Status", icon: "CircleDotDashed" },
        { id: "calls", label: "Calls", icon: "Phone" },
        { id: "archive", label: "Archive", icon: "ArchiveX" },
        { id: "settings", label: "Settings", icon: "Settings" },
        { id: "logout", label: "Logout", icon: "LogOut" },
    ];

    return (
        <section className="bg-cyan-200 flex items-center justify-center py-6 sm:w-fit sm:px-8 sm:flex-col sm:justify-start">
            {/* App Logo/Brand */}
            <div className="p-2 bg-cyan-950 rounded-xl mr-4 sm:mr-0">
                <FaHandshake className="w-6 h-6 text-white" />
            </div>

            <div className="flex flex-row gap-2 sm:gap-4 sm:flex-col sm:h-full sm:justify-between sm:py-8">
                {/* Main Features */}
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-4">
                    {icons.slice(0, 4).map((item) => {
                        const Icon = iconMap[item.icon];
                        const isActive = activeTab === item.id;
                        
                        return (
                            <div key={item.id} className="relative group">
                                <button 
                                    onClick={() => handleFeatureClick(item.id)}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                                        isActive 
                                            ? 'bg-white text-cyan-600 shadow-md' 
                                            : 'hover:bg-gray-200 text-gray-700'
                                    }`}
                                    aria-label={item.label}
                                    title={item.label}
                                >
                                    <Icon className="w-6 h-6" />
                                </button>
                                
                                {/* Tooltip */}
                                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 sm:left-full sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2 sm:ml-2 sm:mt-0">
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Settings & Logout */}
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-4">
                    {icons.slice(4).map((item) => {
                        const Icon = iconMap[item.icon];
                        const isActive = activeTab === item.id;
                        const isLogout = item.id === "logout";
                        
                        return (
                            <div key={item.id} className="relative group">
                                <button 
                                    onClick={() => handleFeatureClick(item.id)}
                                    disabled={isLogout && isLoggingOut}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                                        isLogout && isLoggingOut
                                            ? 'opacity-50 cursor-not-allowed bg-gray-100'
                                            : isActive 
                                                ? 'bg-white text-cyan-600 shadow-md' 
                                                : isLogout
                                                    ? 'hover:bg-red-100 text-gray-700 hover:text-red-600'
                                                    : 'hover:bg-gray-200 text-gray-700'
                                    }`}
                                    aria-label={item.label}
                                    title={item.label}
                                >
                                    {isLogout && isLoggingOut ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Icon className="w-6 h-6" />
                                    )}
                                </button>
                                
                                {/* Tooltip */}
                                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 sm:left-full sm:top-1/2 sm:-translate-x-0 sm:-translate-y-1/2 sm:ml-2 sm:mt-0">
                                    {isLogout && isLoggingOut ? "Signing out..." : item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
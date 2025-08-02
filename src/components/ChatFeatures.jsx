import { FaHandshake } from "react-icons/fa";
import { MessageSquare, CircleDotDashed, Phone, ArchiveX, Settings, LogOut } from "lucide-react";

const iconMap = { MessageSquare, CircleDotDashed, Phone, ArchiveX, Settings, LogOut, };

export default function ChatFeatures() {
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
            <div className="p-2 bg-cyan-950 rounded-xl mr-4 sm:mr-0">
                <FaHandshake className="w-6 h-6 text-white" />
            </div>

            <div className="flex flex-row gap-2 sm:gap-4 sm:flex-col sm:h-full sm:justify-between sm:py-8">
                <div className="flex flex-row sm:flex-col gap-2 sm:gap-4">
                    {icons.slice(0, 4).map((item) => {
                        const Icon = iconMap[item.icon];
                        return (
                        <div key={item.id} className="relative group">
                            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition-colors">
                            <Icon className="w-6 h-6 text-gray-700" />
                            </button>
                            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity lg:left-full lg:top-1/2 lg:-translate-x-0 lg:-translate-y-1/2 lg:ml-2">
                            {item.label}
                            </span>
                        </div>
                        )
                    })}
                </div>

                <div className="flex flex-row sm:flex-col gap-2 sm:gap-4">
                    {icons.slice(4).map((item) => {
                        const Icon = iconMap[item.icon];
                        return (
                        <div key={item.id} className="relative group">
                            <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition-colors">
                            <Icon className="w-6 h-6 text-gray-700" />
                            </button>
                            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity lg:left-full lg:top-1/2 lg:-translate-x-0 lg:-translate-y-1/2 lg:ml-2">
                            {item.label}
                            </span>
                        </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

import { SlidersHorizontal, Search } from "lucide-react"
import chatData from '../data/chats';
import { useEffect, useMemo, useState } from "react";
import { formatTimestamp } from '../utils/formatTimestamp'

export default function ChatList() {

    const [chats, setChats] = useState([]);
    
    useEffect(() => {
        setChats(chatData)
    }, [])

    const sortedChats = useMemo(() => {
        return [...chats].sort((a, b) => {
            const aTimestamp = a.lastMessageTimestamp.seconds + a.lastMessageTimestamp.nanoseconds / 1e9;
            const bTimestamp = b.lastMessageTimestamp.seconds + b.lastMessageTimestamp.nanoseconds / 1e9;

            return bTimestamp - aTimestamp;
        })
    }, [chats])

    return (
        <section className="p-5 sm:w-[490px] sm:flex sm:flex-col sm:justify-left">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">Chats</h1>
                <SlidersHorizontal />
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg my-4">
                <Search className="w-6 h-6 text-gray-700 ml-4" />
                <input type="text" placeholder="Search" className="px-4 h-full w-full py-2 rounded-r-lg outline-none" />
            </div>
                
            {sortedChats.map((chat) => (
                <section key={chat.id} className="py-4 border-b border-gray-200">
                    <div className="w-full">
                        {chat?.users?.filter((user) => user?.email !== "baxo@mailinator.com")?.map((user) => (
                            <div className="flex justify-between items-center ">
                                <div className="flex items-center gap-3">
                                    <img src={user.image} alt="" className="w-13 h-13 rounded-full object-cover" />
                                    <div>
                                        <h1 className="font-semibold">{user.fullName}</h1>
                                        <p className="text-sm w-[300px] line-clamp-1">{chat.lastMessage}</p>
                                    </div>
                                </div>
                                <span className="text-xs">{formatTimestamp(chat.lastMessageTimestamp)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            ))} 
        </section>
    )
}


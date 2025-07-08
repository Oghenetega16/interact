import { SlidersHorizontal, Search } from "lucide-react"

export default function ChatList() {
    return (
        <section className="p-5 sm:w-[400px] sm:flex sm:flex-col sm:justify-left">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">Chats</h1>
                <SlidersHorizontal />
            </div>
            <div className="flex items-center border border-gray-300 rounded-lg my-4">
                <Search className="w-6 h-6 text-gray-700 ml-4" />
                <input type="text" placeholder="Search" className="px-4 h-full w-full py-2 rounded-r-lg outline-none" />
            </div>

            <section className="flex justify-between items-center py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-13 h-13 flex items-center justify-center text-lg rounded-full text-white bg-emerald-600">OS</div>
                    <div>
                        <h1 className="font-semibold">Oghenetega Sukuru</h1>
                        <p className="text-sm">Bro, what's up?</p>
                    </div>
                </div>
                <span className="text-xs">8 July, 2025</span>
            </section>

            <section className="flex justify-between items-center py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-13 h-13 flex items-center justify-center text-lg rounded-full text-white bg-lime-700">AM</div>
                    <div>
                        <h1 className="font-semibold">Alabi Mojoyin</h1>
                        <p className="text-sm">Where are you?</p>
                    </div>
                </div>
                <span className="text-xs">2 July, 2025</span>
            </section>
        </section>
    )
}


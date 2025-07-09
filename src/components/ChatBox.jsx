import { Search } from "lucide-react"

export default function ChatBox() {
    return (
        <section className="w-full  bg-[url('./assets/images/')] ">
            <header className="bg-white flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                    <img src="./assets/images/Passport_Photo.jpg" alt="" className="w-13 h-13 object-cover rounded-full" />
                    <div>
                        <h1 className="text-lg font-semibold">Oghenetega</h1>
                        <span className="text-sm">Software Developer</span>
                    </div>
                </div>
                <Search />
            </header>
        </section>
    )
}


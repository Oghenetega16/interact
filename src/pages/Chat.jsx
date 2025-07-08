import ChatFeatures from "../components/ChatFeatures";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";

export default function Chat() {
    return (
        <main className="min-h-screen flex flex-col lg:flex-row">
            <ChatFeatures />
            <ChatList />
            <ChatBox />
        </main>
    )
}


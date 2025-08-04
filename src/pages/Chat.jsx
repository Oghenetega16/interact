import ChatFeatures from "../components/ChatFeatures";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import { Navigate } from 'react-router-dom';
import useChatStore from "../store/chatStore";

export default function Chat() {
    const { currentUser, isAuthenticated } = useChatStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="min-h-screen flex flex-col sm:flex-row">
            <ChatFeatures />
            <ChatList />
            <div className="hidden lg:block w-full">
                <ChatBox />
            </div>
        </main>
    );
}

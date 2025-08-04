import ChatFeatures from "../components/ChatFeatures";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
// import { useEffect } from "react";
// import useChatStore from "../store/chatStore";
// import socketService from "../services/socketService";
import { Navigate } from 'react-router-dom';

export default function Chat() {
    // const { currentUser, isAuthenticated, setError } = useChatStore();

    // useEffect(() => {
    //     // Connect to socket when component mounts
    //     if (isAuthenticated && currentUser?.token) {
    //         socketService.connect(currentUser.token);
    //     }

    //     // Cleanup on unmount
    //     return () => {
    //         socketService.disconnect();
    //     };
    // }, [isAuthenticated, currentUser]);

    // if (!isAuthenticated) {
    //     return <Navigate to="/login" replace />;
    // }

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
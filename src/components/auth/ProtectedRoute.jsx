import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ReactNode } from "react";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
        <div className="flex justify-center items-center min-h-screen text-white">
            Checking authentication...
        </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <>{children}</>
}

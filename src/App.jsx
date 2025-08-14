import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import useChatStore from "./store/chatStore";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Chat = lazy(() => import('./pages/Chat'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

export default function App() {
  // Use store selectors to avoid infinite loops
  const currentUser = useChatStore((state) => state.currentUser);
  const setCurrentUser = useChatStore((state) => state.setCurrentUser);
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false); // Auth state has been determined
    });

    return () => unsubscribe();
  }, [setCurrentUser]);

  // Show loading while determining auth state
  if (isAuthLoading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <main className="font-montserrat min-h-screen bg-gray-50">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Redirect authenticated users from login/signup pages */}
            <Route 
              path='/' 
              element={currentUser ? <Navigate to="/chat" replace /> : <Login />} 
            />
            <Route 
              path='/login' 
              element={currentUser ? <Navigate to="/chat" replace /> : <Login />} 
            />
            <Route 
              path='/signup' 
              element={currentUser ? <Navigate to="/chat" replace /> : <Signup />} 
            />
            
            {/* Password reset routes */}
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/email-verification" element={<EmailVerification />} />

            {/* Protected chat route */}
            <Route 
              path='/chat' 
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all route - redirect to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </Router>
  );
}

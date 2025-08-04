import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./services/firebase";
import useChatStore from "./store/chatStore";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ForgotPassword from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Chat = lazy(() => import('./pages/Chat'));

export default function App() {

  const setCurrentUser = useChatStore((state) => state.setCurrentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // updates Zustand store
    });

    return () => unsubscribe(); // cleanup
  }, [setCurrentUser]);

  return (
    <Router>
      <main className="font-montserrat">
        <Suspense>
          <Routes>
            <Route path='/login' element={<Login />}></Route>
            <Route path='/signup' element={<Signup />}></Route>
            <Route path="/forgotpassword" element={<ForgotPassword />} />
            <Route path="/email-verification" element={<EmailVerification />} />

            {/* Public Routes */}
            <Route path='/chat' element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
              
          </Routes>
        </Suspense>
      </main>
    </Router>
  )
}


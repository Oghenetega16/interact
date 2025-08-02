import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/auth/ProtectedRoute';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Chat = lazy(() => import('./pages/Chat'));

export default function App() {
  return (
    <Router>
      <main className="font-montserrat">
        <Suspense>
          <Routes>

            <Route path='/login' element={<Login />}>
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            </Route>
            
            <Route path='/signup' element={<Signup />}></Route>
          </Routes>
        </Suspense>
      </main>
    </Router>
  )
}


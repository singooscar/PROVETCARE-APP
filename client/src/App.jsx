import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import RegisterVet from './pages/RegisterVet';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Pets from './pages/Pets';
import Chat from './pages/Chat';

import LandingPage from './pages/LandingPage';

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-vet" element={<RegisterVet />} />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <>
                            <Navbar />
                            <Dashboard />
                        </>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/calendar"
                element={
                    <ProtectedRoute>
                        <>
                            <Navbar />
                            <Calendar />
                        </>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/pets"
                element={
                    <ProtectedRoute>
                        <>
                            <Navbar />
                            <Pets />
                        </>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <>
                            <Navbar />
                            <Chat />
                        </>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export default App;

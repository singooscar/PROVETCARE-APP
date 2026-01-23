import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import RegisterVet from './pages/RegisterVet';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Pets from './pages/Pets';
import Chat from './pages/Chat';
import MedicalHistory from './pages/MedicalHistory';
import LandingPage from './pages/LandingPage';

/**
 * App Component
 * Componente principal que define todas las rutas de la aplicación
 * - Rutas públicas: Landing, Login, Registro de Veterinarios
 * - Rutas protegidas: Dashboard, Calendario, Mascotas, Chat, Historial Médico
 */
function App() {
    return (
        <Routes>
            {/* ========== PUBLIC ROUTES ========== */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-vet" element={<RegisterVet />} />

            {/* ========== PROTECTED ROUTES ========== */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/calendar"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Calendar />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/pets"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Pets />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Chat />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/medical-history/:petId"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <MedicalHistory />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* ========== 404 FALLBACK ========== */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;


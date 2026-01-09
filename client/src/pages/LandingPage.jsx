import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, FileHeart, ShieldCheck, ArrowRight, Dog, Cat } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Navbar Simple */}
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Stethoscope className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                                PROVETCARE
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <Link to="/login" className="text-gray-600 hover:text-blue-600 px-4 py-2 font-medium transition-colors">
                                Iniciar Sesión
                            </Link>
                            <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5">
                                Empezar Ahora
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight">
                            Cuidado Veterinario <br />
                            <span className="text-blue-600">Moderno y Digital</span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                            Gestiona la salud de tus mascotas, agenda citas en segundos y accede a su historial médico desde cualquier lugar. La veterinaria del futuro, hoy.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link to="/login" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1">
                                Agendar Cita
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                            <Link to="/register-vet" className="inline-flex justify-center items-center px-8 py-4 text-lg font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border-2 border-slate-100 transition-all hover:-translate-y-1">
                                Soy Veterinario
                            </Link>
                        </div>

                        <div className="flex items-center gap-6 pt-8 text-slate-500">
                            <div className="flex -space-x-3">
                                <span className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white">🐶</span>
                                <span className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white">🐱</span>
                                <span className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center border-2 border-white">🐰</span>
                            </div>
                            <p className="text-sm font-medium">Más de 500 mascotas atendidas</p>
                        </div>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse delay-1000"></div>

                        <div className="relative bg-white/60 backdrop-blur-xl border border-white/40 p-8 rounded-3xl shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Próxima Cita</h3>
                                    <p className="text-slate-500 text-sm">Hoy, 14:30 PM</p>
                                </div>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Confirmada
                                </span>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                                    🐕
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">Max</h4>
                                    <p className="text-slate-600">Labrador Retriever • 5 años</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <Stethoscope className="h-5 w-5 text-blue-500" />
                                    <span>Vacunación Anual</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <FileHeart className="h-5 w-5 text-rose-500" />
                                    <span>Dr. Carlos Pérez</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Todo lo que necesitas</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Una plataforma integral diseñada para simplificar la vida de los dueños de mascotas y optimizar el trabajo de los veterinarios.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Calendar className="h-8 w-8 text-blue-600" />}
                            title="Agendamiento Fácil"
                            description="Agenda, reprograma o cancela citas en segundos. Recibe recordatorios automáticos por WhatsApp y correo."
                        />
                        <FeatureCard
                            icon={<FileHeart className="h-8 w-8 text-rose-600" />}
                            title="Historial Digital"
                            description="Accede a vacunas, recetas y diagnósticos pasados. Toda la salud de tu mascota en un solo lugar seguro."
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="h-8 w-8 text-green-600" />}
                            title="Pagos Seguros"
                            description="Visualiza costos transparentes antes de pagar. Realiza pagos en línea o presenciales con total seguridad."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="p-8 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300 group">
        <div className="bg-white p-4 rounded-xl w-fit shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-100">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">
            {description}
        </p>
    </div>
);

export default LandingPage;

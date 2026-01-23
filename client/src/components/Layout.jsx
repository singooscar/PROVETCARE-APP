import Navbar from './Navbar';

/**
 * Layout Component
 * Componente wrapper que incluye la navegación para todas las rutas protegidas
 * Evita repetir <Navbar /> en cada ruta
 * 
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Contenido de la página
 */
const Layout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
                {children}
            </main>
        </>
    );
};

export default Layout;

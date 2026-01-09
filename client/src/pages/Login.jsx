import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: ''
    });
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Password validation rules (matching backend)
    const passwordRules = {
        minLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /\d/.test(formData.password),
        hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password),
    };

    const passwordsMatch = formData.password === formData.confirmPassword;
    const isPasswordValid = Object.values(passwordRules).every(rule => rule);

    // Validate name
    const isNameValid = !formData.name || /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(formData.name);

    // Real-time validation
    useEffect(() => {
        const errors = {};

        if (!isLogin) {
            // Validate password strength
            if (formData.password && !isPasswordValid) {
                errors.password = 'La contraseña no cumple con todos los requisitos';
            }

            // Validate password match
            if (formData.confirmPassword && !passwordsMatch) {
                errors.confirmPassword = 'Las contraseñas no coinciden';
            }

            // Validate name
            if (formData.name && !isNameValid) {
                errors.name = 'El nombre solo puede contener letras, espacios, guiones y apóstrofes';
            }

            // Validate phone
            if (formData.phone && !/^\+?[\d\s\-]{7,20}$/.test(formData.phone)) {
                errors.phone = 'Formato de teléfono inválido (ej: +51999888777)';
            }
        }

        setValidationErrors(errors);
    }, [formData, isLogin, isPasswordValid, passwordsMatch, isNameValid]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation before submitting
        if (!isLogin) {
            if (!isPasswordValid) {
                toast.error('La contraseña no cumple con los requisitos de seguridad');
                return;
            }
            if (!passwordsMatch) {
                toast.error('Las contraseñas no coinciden');
                return;
            }
        }

        try {
            if (isLogin) {
                await login(formData.email, formData.password);
                toast.success('¡Bienvenido a PROVETCARE!');
            } else {
                // Don't send confirmPassword to backend
                const { confirmPassword, ...registerData } = formData;
                await register(registerData);
                toast.success('¡Cuenta creada exitosamente!');
            }
            navigate('/dashboard');
        } catch (error) {
            // Handle backend validation errors
            const errorData = error.response?.data;

            if (errorData?.details && Array.isArray(errorData.details)) {
                // Show first validation error
                toast.error(errorData.details[0].message);
            } else {
                toast.error(errorData?.error || errorData?.message || 'Error al autenticar');
            }
        }
    };

    const getInputClassName = (fieldName) => {
        const baseClass = "input";
        if (!isLogin && validationErrors[fieldName]) {
            return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-200`;
        }
        return baseClass;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary-600 mb-2">🐾 PROVETCARE</h1>
                    <p className="text-gray-600">Sistema de Citas Veterinarias</p>
                </div>

                <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => {
                            setIsLogin(true);
                            setFormData({ email: '', password: '', confirmPassword: '', name: '', phone: '' });
                        }}
                        className={`flex-1 py-2 rounded-md transition ${isLogin ? 'bg-white shadow' : ''}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => {
                            setIsLogin(false);
                            setFormData({ email: '', password: '', confirmPassword: '', name: '', phone: '' });
                        }}
                        className={`flex-1 py-2 rounded-md transition ${!isLogin ? 'bg-white shadow' : ''}`}
                    >
                        Registrarse
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            {/* Nombre */}
                            <div>
                                <input
                                    type="text"
                                    placeholder="Nombre completo"
                                    className={getInputClassName('name')}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                {validationErrors.name && (
                                    <div className="mt-1 flex items-start gap-1 text-red-600 text-xs">
                                        <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                                        <span>{validationErrors.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Teléfono */}
                            <div>
                                <input
                                    type="tel"
                                    placeholder="Teléfono (ej: +51999888777)"
                                    className={getInputClassName('phone')}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                                {validationErrors.phone && (
                                    <div className="mt-1 flex items-start gap-1 text-red-600 text-xs">
                                        <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                                        <span>{validationErrors.phone}</span>
                                    </div>
                                )}
                                {!validationErrors.phone && formData.phone && (
                                    <div className="mt-1 flex items-center gap-1 text-gray-500 text-xs">
                                        <Info size={12} />
                                        <span>Formato internacional opcional: +51999888777</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    {/* Contraseña */}
                    <div>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            className={getInputClassName('password')}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            onFocus={() => !isLogin && setPasswordFocus(true)}
                            onBlur={() => setPasswordFocus(false)}
                            required
                        />

                        {/* Password requirements - only show during registration */}
                        {!isLogin && (passwordFocus || formData.password) && (
                            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                                <p className="text-xs font-semibold text-blue-900 mb-2">
                                    Requisitos de contraseña:
                                </p>
                                <PasswordRequirement
                                    met={passwordRules.minLength}
                                    text="Mínimo 8 caracteres"
                                />
                                <PasswordRequirement
                                    met={passwordRules.hasUppercase}
                                    text="Al menos 1 mayúscula (A-Z)"
                                />
                                <PasswordRequirement
                                    met={passwordRules.hasLowercase}
                                    text="Al menos 1 minúscula (a-z)"
                                />
                                <PasswordRequirement
                                    met={passwordRules.hasNumber}
                                    text="Al menos 1 número (0-9)"
                                />
                                <PasswordRequirement
                                    met={passwordRules.hasSpecial}
                                    text="Al menos 1 carácter especial (!@#$%...)"
                                />
                            </div>
                        )}
                    </div>

                    {/* Confirmar Contraseña - only for registration */}
                    {!isLogin && (
                        <div>
                            <input
                                type="password"
                                placeholder="Confirmar Contraseña"
                                className={getInputClassName('confirmPassword')}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            {formData.confirmPassword && (
                                <div className="mt-1 flex items-center gap-1 text-xs">
                                    {passwordsMatch ? (
                                        <>
                                            <CheckCircle size={12} className="text-green-600" />
                                            <span className="text-green-600">Las contraseñas coinciden</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={12} className="text-red-600" />
                                            <span className="text-red-600">Las contraseñas no coinciden</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={!isLogin && (!isPasswordValid || !passwordsMatch)}
                    >
                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </button>
                    {/* Link to Veterinarian Registration */}
                    {isLogin && (
                        <div className="text-center mt-6 pt-6 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">¿Eres veterinario?</p>
                            <button
                                type="button"
                                onClick={() => navigate('/register-vet')}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline"
                            >
                                Registrarse como Veterinario →
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {met ? (
                <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
            ) : (
                <div className="w-3.5 h-3.5 border-2 border-gray-300 rounded-full flex-shrink-0" />
            )}
            <span className={met ? 'text-green-700 font-medium' : 'text-gray-600'}>
                {text}
            </span>
        </div>
    );
}


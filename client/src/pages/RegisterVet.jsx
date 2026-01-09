import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle, Info, KeyRound } from 'lucide-react';

export default function RegisterVet() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        invitationCode: ''
    });
    const [passwordFocus, setPasswordFocus] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const { registerAdmin } = useAuth();
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

        // Validate invitation code
        if (formData.invitationCode && formData.invitationCode.length < 5) {
            errors.invitationCode = 'El código de invitación parece incorrecto';
        }

        setValidationErrors(errors);
    }, [formData, isPasswordValid, passwordsMatch, isNameValid]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation before submitting
        if (!isPasswordValid) {
            toast.error('La contraseña no cumple con los requisitos de seguridad');
            return;
        }
        if (!passwordsMatch) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        if (!formData.invitationCode) {
            toast.error('El código de invitación es requerido');
            return;
        }

        try {
            // Don't send confirmPassword to backend
            const { confirmPassword, ...registerData } = formData;
            await registerAdmin(registerData);
            toast.success('¡Cuenta de veterinario creada exitosamente!');
            navigate('/dashboard');
        } catch (error) {
            // Handle backend validation errors
            const errorData = error.response?.data;

            if (errorData?.details && Array.isArray(errorData.details)) {
                // Show first validation error
                toast.error(errorData.details[0].message);
            } else if (errorData?.message) {
                toast.error(errorData.message);
            } else if (errorData?.error) {
                toast.error(errorData.error);
            } else {
                toast.error('Error al registrar veterinario');
            }
        }
    };

    const getInputClassName = (fieldName) => {
        const baseClass = "input";
        if (validationErrors[fieldName]) {
            return `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-200`;
        }
        return baseClass;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary-600 mb-2">🐾 PROVETCARE</h1>
                    <p className="text-gray-600">Registro de Veterinarios</p>
                    <p className="text-sm text-gray-500 mt-2">Requiere código de invitación</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div>
                        <input
                            type="text"
                            placeholder="Nombre completo (ej: Dr. Juan Pérez)"
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

                    {/* Email */}
                    <div>
                        <input
                            type="email"
                            placeholder="Email profesional"
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
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
                    </div>

                    {/* Código de Invitación */}
                    <div>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Código de invitación"
                                className={`${getInputClassName('invitationCode')} pl-10`}
                                value={formData.invitationCode}
                                onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value })}
                                required
                            />
                        </div>
                        {validationErrors.invitationCode && (
                            <div className="mt-1 flex items-start gap-1 text-red-600 text-xs">
                                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                                <span>{validationErrors.invitationCode}</span>
                            </div>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-gray-500 text-xs">
                            <Info size={12} />
                            <span>Solicita un código a un administrador existente</span>
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            className={getInputClassName('password')}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            onFocus={() => setPasswordFocus(true)}
                            onBlur={() => setPasswordFocus(false)}
                            required
                        />

                        {/* Password requirements */}
                        {(passwordFocus || formData.password) && (
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

                    {/* Confirmar Contraseña */}
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

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={!isPasswordValid || !passwordsMatch || !formData.invitationCode}
                    >
                        Crear Cuenta de Veterinario
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-sm text-primary-600 hover:underline"
                        >
                            ← Volver al inicio de sesión
                        </button>
                    </div>
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

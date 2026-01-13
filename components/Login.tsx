
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import Logo from './Logo';
import { Loader2, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, signUp } = useAppContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!isLoginView && password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            setIsLoading(false);
            return;
        }

        try {
            if (isLoginView) {
                await login(email, password);
            } else {
                await signUp(email, password);
            }
        } catch (err: any) {
            const errorCode = err.code;
            const expectedErrors = [
                'auth/invalid-credential',
                'auth/invalid-login-credentials',
                'auth/user-not-found',
                'auth/wrong-password',
                'auth/too-many-requests',
                'auth/email-already-in-use',
                'auth/weak-password'
            ];

            if (!expectedErrors.includes(errorCode)) {
                console.error("Auth Error:", err);
            }

            if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/invalid-login-credentials' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                setError('Correo o contraseña incorrectos. Si no tienes cuenta, regístrate primero.');
            } else if (errorCode === 'auth/too-many-requests') {
                setError('Cuenta bloqueada temporalmente por seguridad debido a múltiples intentos fallidos. Por favor espera unos minutos e intenta de nuevo.');
            } else if (errorCode === 'auth/email-already-in-use') {
                setError('Este correo ya ha sido registrado. Intenta iniciar sesión.');
            } else if (errorCode === 'auth/weak-password') {
                setError('La contraseña es muy débil. Debe tener al menos 6 caracteres.');
            } else if (errorCode === 'auth/network-request-failed') {
                setError('Error de conexión. Verifica tu internet.');
            } else {
                 setError(err.message || 'Ocurrió un error inesperado al procesar tu solicitud.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center justify-center gap-4 mb-8">
                    <Logo size="lg" className="shadow-2xl shadow-blue-900/40" />
                    <h1 className="text-3xl font-bold text-white tracking-tight">Credit IQ</h1>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-sm">
                    <div className="flex border-b border-slate-700 mb-6 relative">
                        <button
                            onClick={() => { setIsLoginView(true); setError(''); }}
                            className={`flex-1 py-3 font-semibold transition-all duration-300 text-sm tracking-wide ${isLoginView ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            INICIAR SESIÓN
                        </button>
                        <button
                            onClick={() => { setIsLoginView(false); setError(''); }}
                            className={`flex-1 py-3 font-semibold transition-all duration-300 text-sm tracking-wide ${!isLoginView ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            REGISTRARSE
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-400 uppercase">Correo Electrónico</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                className="bg-slate-900/80 border border-slate-700 rounded-lg w-full py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                                placeholder="ejemplo@empresa.com"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-400 uppercase">Contraseña</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                className="bg-slate-900/80 border border-slate-700 rounded-lg w-full py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        {!isLoginView && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="block text-xs font-medium text-gray-400 uppercase">Confirmar Contraseña</label>
                                <input 
                                    type="password" 
                                    value={confirmPassword} 
                                    onChange={e => setConfirmPassword(e.target.value)} 
                                    required 
                                    className="bg-slate-900/80 border border-slate-700 rounded-lg w-full py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 text-red-200 text-sm animate-fade-in">
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-[1.02] transform transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLoginView ? 'Entrar a Credit IQ' : 'Crear Cuenta')}
                        </button>
                    </form>
                    
                    <p className="text-center text-xs text-gray-500 mt-6">
                        Al continuar, aceptas los términos y condiciones de Credit IQ Financial Services.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

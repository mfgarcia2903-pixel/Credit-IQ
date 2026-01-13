
import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { X, User, Lock, Mail, Shield, Loader2, CheckCircle2, Key } from 'lucide-react';
import { UserRole } from '../types';

interface ProfileModalProps {
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
    const { userData, updateUserPassword, makeApiKey, updateMakeApiKey } = useAppContext();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [apiKeyInput, setApiKeyInput] = useState(makeApiKey);
    const [isSaving, setIsSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg({ type: '', text: '' });

        if (password !== confirmPassword) {
            setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }
        if (password.length < 6) {
            setMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
            return;
        }

        setIsSaving(true);
        try {
            await updateUserPassword(password);
            setMsg({ type: 'success', text: 'Contraseña actualizada correctamente' });
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                 setMsg({ type: 'error', text: 'Por seguridad, vuelve a iniciar sesión antes de cambiar la contraseña.' });
            } else {
                 setMsg({ type: 'error', text: 'Error al actualizar contraseña. ' + error.message });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveApiKey = () => {
        updateMakeApiKey(apiKeyInput);
        setMsg({ type: 'success', text: 'API Key de Make.com guardada correctamente.' });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-in-up overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-purple-500" /> Configuración de Perfil
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* User Info */}
                    <div className="space-y-4">
                         <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-800 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-900/20">
                                {userData?.email?.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-white font-medium text-lg">Usuario</p>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Mail size={12} /> {userData?.email}
                                </div>
                            </div>
                         </div>
                         
                         <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                             <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Shield size={14} /> Rol Asignado
                             </div>
                             <span className="text-xs uppercase font-bold tracking-wider bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                                {userData?.role}
                             </span>
                         </div>
                    </div>

                    {/* Change Password */}
                    <div className="pt-6 border-t border-slate-800">
                        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                            <Lock size={16} className="text-gray-400" /> Cambiar Contraseña
                        </h3>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <input 
                                type="password" 
                                placeholder="Nueva contraseña" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <input 
                                type="password" 
                                placeholder="Confirmar nueva contraseña" 
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            
                            <button 
                                type="submit" 
                                disabled={isSaving || !password}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-900/30"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Actualizar Contraseña'}
                            </button>
                        </form>
                    </div>

                    {/* API Configuration - Admin Only */}
                    {userData?.role === UserRole.Admin && (
                        <div className="pt-6 border-t border-slate-800">
                            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                <Key size={16} className="text-gray-400" /> Configuración API (Make.com)
                            </h3>
                            <div className="space-y-4">
                                <p className="text-xs text-gray-400">
                                    Esta llave se utilizará para autenticar las peticiones al Webhook de simulación. Se guarda localmente en su navegador.
                                </p>
                                 <input 
                                    type="password" 
                                    placeholder="Pegar x-make-apikey aquí" 
                                    value={apiKeyInput}
                                    onChange={e => setApiKeyInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors font-mono text-sm"
                                />
                                <button 
                                    type="button"
                                    onClick={handleSaveApiKey}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    Guardar API Key
                                </button>
                            </div>
                        </div>
                    )}

                    {msg.text && (
                        <div className={`p-3 rounded-lg text-sm flex items-start gap-2 animate-fade-in ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {msg.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5" /> : <Shield size={16} className="mt-0.5" />}
                            {msg.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;

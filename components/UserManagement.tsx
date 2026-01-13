
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { UserData, UserRole } from '../types';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';

interface UserManagementProps {
    onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
    const { inviteUser, listUsers, removeUser } = useAppContext();
    const [users, setUsers] = useState<Omit<UserData, 'uid'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.Reviewer);
    const [isInviting, setIsInviting] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const userList = await listUsers();
            setUsers(userList);
        } catch (err: any) {
            setError(err.message || 'Error al cargar usuarios.');
        } finally {
            setIsLoading(false);
        }
    }, [listUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsInviting(true);
        try {
            await inviteUser(newEmail, newRole);
            setNewEmail('');
            setNewRole(UserRole.Reviewer);
            await fetchUsers(); // Refresh user list
        } catch (err: any) {
            setError(err.message || 'Error al invitar usuario.');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (email: string) => {
        if(window.confirm(`¿Seguro que quieres eliminar el acceso para ${email}? Esta acción no se puede deshacer.`)) {
            setError('');
            setIsLoading(true);
            try {
                await removeUser(email);
                await fetchUsers();
            } catch (err: any) {
                setError(err.message || 'Error al eliminar usuario.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-2xl shadow-lg transform transition-all animate-slide-in-up">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold">Administrar Usuarios</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Invite User Form */}
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="font-semibold mb-3">Invitar Nuevo Usuario</h3>
                        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row items-start gap-3">
                            <input
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                required
                                className="bg-slate-800 border border-slate-600 rounded-md w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 flex-grow"
                            />
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as UserRole)}
                                className="bg-slate-800 border border-slate-600 rounded-md w-full sm:w-auto py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                            >
                                <option value={UserRole.Requester}>Requester (Cliente)</option>
                                <option value={UserRole.Reviewer}>Reviewer (Analista)</option>
                                <option value={UserRole.Admin}>Admin (Propietario)</option>
                            </select>
                            <button
                                type="submit"
                                disabled={isInviting}
                                className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors w-full sm:w-auto disabled:opacity-50"
                            >
                                {isInviting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                                Invitar
                            </button>
                        </form>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    
                    {/* User List */}
                    <div>
                        <h3 className="font-semibold mb-3">Usuarios Existentes</h3>
                        {isLoading && !users.length ? (
                             <div className="text-center py-4"><Loader2 className="animate-spin mx-auto" /></div>
                        ) : (
                            <div className="space-y-2">
                                {users.map((user) => (
                                    <div key={user.email} className="bg-slate-900/50 p-3 rounded-md flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{user.email}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                                                    user.role === UserRole.Admin ? 'bg-purple-500/30 text-purple-300' : 
                                                    user.role === UserRole.Reviewer ? 'bg-blue-500/30 text-blue-300' :
                                                    'bg-green-500/30 text-green-300'
                                                }`}>
                                                    {user.role}
                                                </span>
                                                <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'}`}>
                                                    {user.status === 'active' ? 'Activo' : 'Invitado'}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemove(user.email)} title="Eliminar Acceso" disabled={isLoading}>
                                            <Trash2 size={18} className="text-red-500 hover:text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;

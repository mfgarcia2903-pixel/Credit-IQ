
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AppProvider, useAppContext } from './hooks/useAppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import Questionnaire from './components/Questionnaire';
import Analysis from './components/Analysis';
import Report from './components/Report';
import Summary from './components/Summary';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ProfileModal from './components/ProfileModal';
import Logo from './components/Logo';
import { AppStep, UserRole } from './types';
import { ArrowLeft, LogOut, Users, User, ChevronDown, List, Settings, BarChart3, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
    const [step, setStep] = useState<AppStep>(AppStep.Home);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    
    const { isAppLoading, logout, user, userData } = useAppContext();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleReset = useCallback(() => {
        setStep(AppStep.Home);
    }, []);

    const renderStep = () => {
        switch (step) {
            case AppStep.Home:
                return <Landing setStep={setStep} />;
            case AppStep.Dashboard:
                return <Dashboard setStep={setStep} />;
            case AppStep.Summary:
                return <Summary setStep={setStep} />;
            case AppStep.Questionnaire:
                return <Questionnaire setStep={setStep} />;
            case AppStep.Analysis:
                return <Analysis setStep={setStep} />;
            case AppStep.Report:
                return <Report setStep={setStep} onReset={handleReset} />;
            default:
                return <Landing setStep={setStep} />;
        }
    };

    const handleBack = useCallback(() => {
        if (step > AppStep.Dashboard) {
            setStep(prev => prev - 1);
        } else {
            setStep(AppStep.Home);
        }
    }, [step]);
    
    const isRequester = userData?.role === UserRole.Requester;
    const isPrivileged = userData?.role === UserRole.Admin || userData?.role === UserRole.Reviewer;
    const showSidebar = step !== AppStep.Home && step !== AppStep.Dashboard; 

    return (
        <div className="h-screen font-sans flex flex-col bg-slate-950 text-white overflow-hidden">
            {/* SPINNER GLOBAL NO BLOQUEANTE */}
            {isAppLoading && (
                <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-purple-500" size={40} />
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-400">Cargando...</span>
                    </div>
                </div>
            )}

            <header className="shrink-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 h-20 px-6 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
                    <Logo size="md" className="group-hover:scale-110" />
                    <h1 className="text-2xl font-bold text-white tracking-tight hidden sm:block">Credit IQ</h1>
                </div>

                <div className="flex items-center gap-4">
                    {isPrivileged && step !== AppStep.Dashboard && (
                        <button 
                            onClick={() => setStep(AppStep.Dashboard)}
                            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors hover:bg-blue-400/10 px-4 py-2 rounded-lg font-bold text-sm border border-blue-400/20"
                        >
                            <BarChart3 size={18} />
                            <span className="hidden md:inline">Consola de Datos</span>
                        </button>
                    )}

                    {isRequester && step !== AppStep.Dashboard && (
                        <button 
                            onClick={() => setStep(AppStep.Dashboard)}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors hover:bg-slate-800 px-4 py-2 rounded-lg font-medium text-sm"
                        >
                            <List size={18} />
                            <span>Mis Estudios</span>
                        </button>
                    )}

                    {userData?.role && (
                         <span className="hidden md:block text-[9px] bg-slate-800 px-2 py-0.5 rounded text-gray-500 uppercase font-bold border border-slate-700 tracking-wider">
                            {userData.role}
                         </span>
                    )}

                    {step > AppStep.Dashboard && (
                        <button onClick={handleBack} className="p-2 rounded-full hover:bg-slate-800 text-gray-400 transition-colors" title="Atrás">
                            <ArrowLeft size={20} />
                        </button>
                    )}

                    {userData?.role === UserRole.Admin && (
                         <button onClick={() => setIsUserModalOpen(true)} title="Administrar Usuarios" className="p-2 rounded-full text-gray-300 hover:bg-slate-800 transition-colors">
                            <Users size={20} />
                        </button>
                    )}

                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold text-purple-200 border-2 border-slate-800 shadow-sm">
                                {userData?.email?.substring(0,2).toUpperCase()}
                            </div>
                            <ChevronDown size={16} className={`text-gray-500 mr-1 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 animate-fade-in z-50 overflow-hidden ring-1 ring-black/5">
                                <div className="px-5 py-4 border-b border-slate-800 mb-1 bg-slate-800/30">
                                    <p className="text-sm font-medium text-white truncate">Hola, {userData?.email?.split('@')[0]}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{userData?.email}</p>
                                </div>
                                
                                <button 
                                    onClick={() => { setIsProfileDropdownOpen(false); setIsProfileModalOpen(true); }}
                                    className="w-full text-left px-5 py-3 text-sm text-gray-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors"
                                >
                                    <User size={18} className="text-purple-500" /> Mi Perfil
                                </button>
                                
                                <div className="h-px bg-slate-800 my-1 mx-2"></div>
                                
                                <button 
                                    onClick={logout} 
                                    className="w-full text-left px-5 py-3 text-sm text-red-400 hover:bg-red-900/10 flex items-center gap-3 transition-colors"
                                >
                                    <LogOut size={18} /> Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative h-[calc(100vh-5rem)]">
                <div className={`h-full transition-all duration-500 ease-in-out border-r border-slate-800/50 ${showSidebar ? 'w-full md:w-72 lg:w-80 translate-x-0' : 'w-0 -translate-x-full overflow-hidden border-none'}`}>
                   {showSidebar && <Sidebar currentStep={step} setStep={setStep} />}
                </div>

                <main className={`flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 transition-all duration-300 ${showSidebar ? '' : 'w-full'}`}>
                    {renderStep()}
                </main>
            </div>

            {isUserModalOpen && <UserManagement onClose={() => setIsUserModalOpen(false)} />}
            {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
        </div>
    );
}

const App: React.FC = () => {
    return (
        <AppProvider>
            <AuthRouter />
        </AppProvider>
    );
};

const AuthRouter: React.FC = () => {
    const { user, isAuthLoading } = useAppContext();

    if (isAuthLoading) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    return <AppContent />;
}

export default App;

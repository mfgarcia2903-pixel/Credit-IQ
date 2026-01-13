
import React from 'react';
import { AppStep, UserRole } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { LayoutDashboard, FileText, BarChart3, Download, List, Shield, ArrowLeft } from 'lucide-react';

interface SidebarProps {
    currentStep: AppStep;
    setStep: (step: AppStep) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentStep, setStep }) => {
    const { userData } = useAppContext();
    const isRequester = userData?.role === UserRole.Requester;

    // Items start empty. We only show process steps here.
    let items: { id: AppStep; label: string; icon: React.ElementType }[] = [];

    // If we are looking at a specific application (step > Dashboard)
    if (currentStep > AppStep.Dashboard) {
        // Changed order: Questionnaire first, then Summary
        items.push({ id: AppStep.Questionnaire, label: 'Cuestionario y Archivos', icon: FileText });
        items.push({ id: AppStep.Summary, label: 'Resumen y Estatus', icon: LayoutDashboard });
        
        // Requesters don't see Analysis or Report
        if (!isRequester) {
            items.push({ id: AppStep.Analysis, label: 'Análisis Financiero', icon: BarChart3 });
            items.push({ id: AppStep.Report, label: 'Reporte Final', icon: Download });
        }
    }

    return (
        <aside className="w-full md:w-72 lg:w-80 bg-slate-800 p-6 md:p-8 border-l border-slate-700/50 flex flex-col h-full">
            {/* Botón para salir del proceso y volver a la lista */}
            <button 
                onClick={() => setStep(AppStep.Dashboard)}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
            >
                <div className="p-1 rounded-full bg-slate-700 group-hover:bg-slate-600 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                <span className="text-sm font-medium">Volver a Lista</span>
            </button>

            <h2 className="text-lg font-semibold text-white mb-8">
                Detalle de Solicitud
            </h2>
            
            <div className="relative flex-grow">
                {/* Vertical Line */}
                <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-slate-700"></div>
                
                <ul className="space-y-6">
                    {items.map((step) => {
                        const isActive = currentStep === step.id;
                        // Logic: Is completed if current step index is higher than this step's index
                        const isCompleted = currentStep > step.id; 
                        
                        return (
                            <li 
                                key={step.id} 
                                className={`flex items-center gap-4 cursor-pointer hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-90'}`}
                                onClick={() => setStep(step.id)}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 border-2 
                                    ${isActive 
                                        ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-900/40 scale-110' 
                                        : isCompleted 
                                            ? 'bg-slate-900 border-purple-500/50' 
                                            : 'bg-slate-900 border-slate-600'
                                    }
                                `}>
                                    <step.icon size={14} className={`${isActive ? 'text-white' : isCompleted ? 'text-purple-400' : 'text-gray-500'}`} />
                                </div>
                                <span className={`font-medium text-sm transition-colors duration-300 
                                    ${isActive ? 'text-white' : 'text-gray-400'}
                                `}>
                                    {step.label}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            
            {userData?.role !== UserRole.Requester && (
                <div className="mt-auto pt-6 border-t border-slate-700 text-xs text-gray-500 flex items-center gap-2">
                    <Shield size={12} />
                    <span>Admin/Reviewer Mode</span>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;

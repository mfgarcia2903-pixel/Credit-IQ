
import React from 'react';
import { AppStep, StudyStatus, UserRole } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { CheckCircle2, Clock, FileText, UploadCloud, AlertTriangle, PlayCircle, Ban, ArrowRight, Cog, Eye, Loader2, RotateCcw, StopCircle } from 'lucide-react';

interface SummaryProps {
    setStep: (step: AppStep) => void;
}

const TimelineStep: React.FC<{ 
    label: string; 
    active: boolean; 
    completed: boolean; 
    error?: boolean; 
    icon: React.ElementType 
}> = ({ label, active, completed, error, icon: Icon }) => {
    let bgColor = 'bg-slate-800';
    let borderColor = 'border-slate-600';
    let iconColor = 'text-gray-500';

    if (error) {
        bgColor = 'bg-red-900/20';
        borderColor = 'border-red-500';
        iconColor = 'text-red-500';
    } else if (completed) {
        bgColor = 'bg-green-900/20';
        borderColor = 'border-green-500';
        iconColor = 'text-green-500';
    } else if (active) {
        bgColor = 'bg-blue-900/20';
        borderColor = 'border-blue-500';
        iconColor = 'text-blue-500';
    }

    return (
        <div className="flex flex-col items-center relative z-10 w-24">
            <div className={`w-10 h-10 rounded-full border-2 ${borderColor} ${bgColor} flex items-center justify-center mb-2 transition-all`}>
                <Icon size={18} className={iconColor} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-tighter text-center ${active || completed ? 'text-white' : 'text-gray-500'}`}>
                {label}
            </span>
        </div>
    );
};

const Summary: React.FC<SummaryProps> = ({ setStep }) => {
    const { currentStudy, userData, saveStudyToFirestore, runSimulationPythonProcess, approveStudy, rejectStudy, resetStudyStatus } = useAppContext();
    const isReviewerOrAdmin = userData?.role === UserRole.Reviewer || userData?.role === UserRole.Admin;

    const currentStatus = currentStudy.status || StudyStatus.Draft;

    const steps = [
        { id: StudyStatus.Uploaded, label: 'Carga', icon: UploadCloud },
        { id: StudyStatus.Processing, label: 'Procesando', icon: Cog },
        { id: StudyStatus.PendingReview, label: 'Revisión', icon: Eye },
        { id: StudyStatus.Approved, label: 'Decisión', icon: CheckCircle2 },
    ];

    const getStepState = (stepId: StudyStatus) => {
        const order = [
            StudyStatus.Draft,
            StudyStatus.Uploaded, 
            StudyStatus.Processing,
            StudyStatus.PendingReview,
            StudyStatus.Corrected,
            StudyStatus.Approved
        ];
        
        if (currentStatus === StudyStatus.Rejected && stepId === StudyStatus.Approved) {
            return { active: false, completed: false, error: true };
        }
        
        const currentIndex = order.indexOf(currentStatus === StudyStatus.Rejected ? StudyStatus.Approved : currentStatus);
        let mappedStepIndex = order.indexOf(stepId);
        
        return {
            completed: mappedStepIndex < currentIndex,
            active: stepId === currentStatus || (stepId === StudyStatus.PendingReview && currentStatus === StudyStatus.Corrected),
            error: false
        };
    };

    const handleStartProcessing = async () => {
        if (!currentStudy.id) return;
        await runSimulationPythonProcess(currentStudy.id);
    };

    const handleResetProcess = async () => {
        if (!currentStudy.id) return;
        await resetStudyStatus(currentStudy.id);
    };

    const handleApprove = async () => {
        if (!currentStudy.id) return;
        await approveStudy(currentStudy.id);
    };
    
    const handleReject = async () => {
        if (!currentStudy.id) return;
        await rejectStudy(currentStudy.id);
    };

    return (
        <div className="animate-fade-in space-y-8 pb-10">
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                         <h2 className="text-3xl font-bold text-white tracking-tight">{currentStudy.empresaNombre || 'Configuración de Solicitud'}</h2>
                         <div className="flex items-center gap-3 mt-2">
                             <span className="text-gray-400 text-sm font-sans">{currentStudy.giro || 'Sector No Especificado'}</span>
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                             <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-full text-purple-400 uppercase font-bold border border-slate-700 tracking-widest">
                                Estatus: {currentStatus}
                             </span>
                         </div>
                    </div>
                    
                    {currentStudy.id && (
                        <div className="flex flex-wrap gap-3">
                             {isReviewerOrAdmin && (
                                <>
                                    {(currentStatus === StudyStatus.Uploaded || currentStatus === StudyStatus.Draft) && (
                                         <button 
                                            onClick={handleStartProcessing} 
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-purple-900/30 transition-all transform hover:scale-105 active:scale-95 uppercase tracking-widest border border-purple-500/40"
                                         >
                                             <PlayCircle size={18}/> Iniciar Digitalización (Python)
                                         </button>
                                     )}
                                     
                                    {(currentStatus === StudyStatus.PendingReview || currentStatus === StudyStatus.Corrected) && (
                                        <>
                                            <button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-red-900/20 border border-red-500/30">
                                                <Ban size={16}/> Rechazar
                                            </button>
                                            <button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all uppercase tracking-widest shadow-lg shadow-green-900/20 border border-green-500/30">
                                                <CheckCircle2 size={16}/> Aprobar Solicitud
                                            </button>
                                        </>
                                     )}
                                </>
                             )}
                             
                             {currentStatus === StudyStatus.Draft && userData?.role === UserRole.Requester && (
                                 <button onClick={() => saveStudyToFirestore(StudyStatus.Uploaded)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-900/30 uppercase tracking-widest">
                                     <UploadCloud size={18}/> Finalizar y Enviar
                                 </button>
                             )}
                        </div>
                    )}
                </div>

                <div className="relative flex justify-between items-center max-w-4xl mx-auto py-12 px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
                    {steps.map((step) => {
                        const { active, completed, error } = getStepState(step.id);
                        return (
                            <TimelineStep 
                                key={step.id} 
                                label={step.label === 'Decisión' && error ? 'Rechazado' : step.label} 
                                icon={error ? AlertTriangle : step.icon}
                                active={active} 
                                completed={completed} 
                                error={error}
                            />
                        );
                    })}
                </div>
                
                {currentStatus === StudyStatus.Processing && (
                    <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 mt-6 animate-fade-in font-sans">
                        <div className="flex items-center gap-4 text-blue-300">
                            <Loader2 className="animate-spin text-blue-400" size={24} />
                            <div>
                                <span className="text-sm font-bold uppercase tracking-widest block">Procesamiento en curso</span>
                                <span className="text-[10px] text-blue-400/70 font-mono tracking-tight">Esperando respuesta del Webhook de n8n...</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleResetProcess}
                            className="bg-slate-900/80 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-700 hover:border-red-500 transition-all flex items-center gap-2"
                        >
                            <StopCircle size={14} /> Detener Proceso
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm">
                    <h3 className="font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs text-purple-400">
                        <FileText size={16} /> Verificación de Documentos
                    </h3>
                    <div className="space-y-4 font-sans">
                         <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                             <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Cuestionario Digital</span>
                                <span className="text-white text-sm font-medium">Datos Generales y Financieros</span>
                             </div>
                             <span className="text-[10px] bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-bold uppercase border border-green-500/30">Completo</span>
                         </div>
                         <div className="flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                             <div className="flex flex-col">
                                <span className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Análisis de Balances</span>
                                <span className="text-white text-sm font-medium">Estados Financieros (PDF)</span>
                             </div>
                             {currentStudy.files.estadosFinancierosAnual1 ? (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-bold uppercase border border-green-500/30">Cargado</span>
                             ) : (
                                <span className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full font-bold uppercase border border-red-500/30">Faltante</span>
                             )}
                         </div>
                    </div>
                    <button 
                        onClick={() => setStep(AppStep.Questionnaire)} 
                        className="mt-8 text-purple-400 text-xs font-bold hover:text-purple-300 flex items-center gap-2 uppercase tracking-widest transition-all group"
                    >
                        Editar Información <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs text-blue-400">
                            <Clock size={16} /> Entregables y Resultados
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-sans mb-6">
                            Una vez finalizado el ciclo de procesamiento, podrá descargar el reporte ejecutivo con el score de riesgo crediticio calculado por Gemini 2.5 Flash.
                        </p>
                    </div>

                    {currentStatus === StudyStatus.Approved ? (
                        <div className="text-center p-6 bg-green-600/10 rounded-2xl border border-green-500/20">
                            <CheckCircle2 size={32} className="mx-auto text-green-500 mb-3" />
                            <p className="text-green-400 font-bold mb-4 uppercase text-xs tracking-widest">Dictamen Finalizado</p>
                            <button 
                                onClick={() => setStep(AppStep.Report)} 
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-purple-900/20 transition-all transform hover:scale-[1.02]"
                            >
                                Descargar Reporte PDF
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentStatus === StudyStatus.PendingReview && (
                                <button 
                                    onClick={() => setStep(AppStep.Analysis)} 
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-slate-700 shadow-xl"
                                >
                                    <Eye size={18}/> Abrir Mesa de Análisis
                                </button>
                            )}
                            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800 text-[10px] text-gray-600 uppercase font-bold text-center tracking-tighter">
                                Los resultados se actualizan automáticamente tras el proceso Python.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Summary;

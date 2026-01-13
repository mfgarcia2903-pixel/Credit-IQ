
import React, { useState } from 'react';
import { AppStep, SECTORES, GARANTIAS, Study, StudyFiles, StudyStatus, UserRole } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { PlusCircle, Trash2, Upload, File as FileIcon, Loader2, Save, Send, AlertTriangle, Users, Building2, Wallet } from 'lucide-react';

const FormSection: React.FC<{ title: string; children: React.ReactNode; icon?: React.ElementType }> = ({ title, children, icon: Icon }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2 font-sans">
            {Icon && <Icon size={20} className="text-purple-500" />}
            {title}
        </h3>
        {children}
    </div>
);

const noSpinnerClass = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`bg-slate-900 border border-slate-700 rounded-md w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm font-sans ${noSpinnerClass} ${props.className || ''}`} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`bg-slate-900 border border-slate-700 rounded-md w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm font-sans ${props.className || ''}`}>
        {props.children}
    </select>
);

const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const toProperCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
};

const FinancialInput: React.FC<{
    value: number;
    onChange: (val: number) => void;
    className?: string;
    prefix?: string;
    suffix?: string;
    isLarge?: boolean;
    isInteger?: boolean;
    readOnly?: boolean;
}> = ({ value, onChange, className, prefix, suffix, isLarge, isInteger, readOnly }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (readOnly) return;
        const rawDigits = e.target.value.replace(/\D/g, '');
        if (rawDigits === '') {
            onChange(0);
            return;
        }
        const numValue = isInteger ? parseInt(rawDigits, 10) : parseInt(rawDigits, 10) / 100;
        onChange(numValue);
    };

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        input.setSelectionRange(input.value.length, input.value.length);
    };

    const decimals = isInteger ? 0 : 2;
    const displayValue = (value || 0).toLocaleString('es-MX', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
    
    const isZero = !value || value === 0;

    return (
        <div className={`relative group w-full ${isLarge ? 'h-14' : 'h-10'}`}>
            {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm select-none pointer-events-none z-10 font-sans">
                    {prefix}
                </span>
            )}
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleInputChange}
                onSelect={handleSelect}
                onMouseDown={handleSelect}
                readOnly={readOnly}
                className={`absolute inset-0 bg-slate-900 border border-slate-700 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-600 text-right font-sans font-semibold tracking-tight transition-all
                    ${isZero ? 'text-slate-600' : 'text-white'} 
                    ${prefix ? 'pl-8' : ''} 
                    ${suffix ? 'pr-8' : ''} 
                    ${isLarge ? 'text-2xl' : 'text-sm'}
                    ${readOnly ? 'bg-slate-950 border-slate-800 cursor-not-allowed text-gray-400' : ''}
                    ${className || ''}`}
            />
            {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm select-none pointer-events-none z-10 font-sans">
                    {suffix}
                </span>
            )}
        </div>
    );
};

const Questionnaire: React.FC<{ setStep: (step: AppStep) => void; }> = ({ setStep }) => {
    const { currentStudy, setCurrentStudy, uploadStudyFile, removeStudyFile, saveStudyToFirestore, runReputationAnalysis } = useAppContext();
    const [uploading, setUploading] = useState<Partial<Record<string, boolean>>>({});
    const [isSaving, setIsSaving] = useState(false);

    // --- LÓGICA DINÁMICA DE PERIODOS (DESFASE DE 3 MESES) ---
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth(); // 0 = Enero, 3 = Abril

    // Anuales: Si hoy es antes de abril, el último año disponible es year-2. Si es abril o posterior, es year-1.
    // Ej: En Marzo 2025, el último reporte disponible es 2023. En Abril 2025, es 2024.
    const latestAnnual = currMonth >= 3 ? currYear - 1 : currYear - 2;
    const annuals = [latestAnnual, latestAnnual - 1, latestAnnual - 2];

    // Trimestrales: Un trimestre de retraso.
    // Ene-Mar -> Reporte Q3 Septiembre año anterior.
    // Abr-Jun -> Reporte Q4 Diciembre año anterior.
    // Jul-Sep -> Reporte Q1 Marzo año en curso.
    // Oct-Dic -> Reporte Q2 Junio año en curso.
    let qMonthName = "";
    let qYear = currYear;
    let qNum = 1;

    if (currMonth < 3) { qNum = 3; qYear = currYear - 1; qMonthName = "Septiembre"; }
    else if (currMonth < 6) { qNum = 4; qYear = currYear - 1; qMonthName = "Diciembre"; }
    else if (currMonth < 9) { qNum = 1; qYear = currYear; qMonthName = "Marzo"; }
    else { qNum = 2; qYear = currYear; qMonthName = "Junio"; }

    const quarterLabelActual = `${qNum}T (${qMonthName} ${qYear})`;
    const quarterLabelComparativo = `${qNum}T (${qMonthName} ${qYear - 1})`;

    const updateQuestionnaire = (section: keyof Study['questionnaire'], field: string, value: any) => {
        setCurrentStudy(prev => ({
            ...prev,
            questionnaire: {
                ...prev.questionnaire,
                [section]: {
                    ...prev.questionnaire[section] as any,
                    [field]: value
                }
            }
        }));
    };
    
    const updateArrayRow = (section: 'accionistas' | 'clientes' | 'proveedores', id: string, field: string, value: any) => {
        setCurrentStudy(prev => {
            const list = [...(prev.questionnaire[section] as any[])];
            const idx = list.findIndex(item => item.id === id);
            if (idx !== -1) {
                list[idx] = { ...list[idx], [field]: value };
            }
            return {
                ...prev,
                questionnaire: {
                    ...prev.questionnaire,
                    [section]: list
                }
            };
        });
    };

    const addRow = (section: 'accionistas' | 'clientes' | 'proveedores') => {
        const newItem = section === 'accionistas' 
            ? { id: crypto.randomUUID(), nombre: '', participacion: 0 }
            : { id: crypto.randomUUID(), nombre: '', sector: '', diasPago: 0 };
            
        setCurrentStudy(prev => ({
            ...prev,
            questionnaire: {
                ...prev.questionnaire,
                [section]: [...(prev.questionnaire[section] as any[]), newItem]
            }
        }));
    };

    const removeRow = (section: 'accionistas' | 'clientes' | 'proveedores', id: string) => {
        setCurrentStudy(prev => ({
            ...prev,
            questionnaire: {
                ...prev.questionnaire,
                [section]: (prev.questionnaire[section] as any[]).filter((row: any) => row.id !== id)
            }
        }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof StudyFiles) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploading(prev => ({ ...prev, [key]: true }));
            try {
                await uploadStudyFile(key, file);
            } catch (error) {
                console.error("Upload failed:", error);
            } finally {
                setUploading(prev => ({ ...prev, [key]: false }));
            }
        }
        e.target.value = '';
    };

    const handleSaveProgress = async () => {
        setIsSaving(true);
        await saveStudyToFirestore();
        setIsSaving(false);
        alert("Progreso guardado.");
    };
    
    const { datosGenerales, accionistas, solicitud, clientes, proveedores } = currentStudy.questionnaire;

    const residualMonto = (solicitud.monto || 0) * ((solicitud.residualPct || 0) / 100);
    const ocMonto = (solicitud.monto || 0) * ((solicitud.opcionCompraPct || 0) / 100);
    const depositoMonto = (solicitud.monto || 0) * ((solicitud.depositoGarantiaPct || 0) / 100);
    const rentaAnticipadaMonto = (solicitud.renta || 0) * (solicitud.rentaAnticipadaTimes || 0);

    const totalParticipation = accionistas.reduce((sum, acc) => sum + (acc.participacion || 0), 0);
    const isParticipationValid = Math.abs(totalParticipation - 100) < 0.01;

    const handleSend = async () => {
        if (!isParticipationValid) {
            alert("La participación de accionistas debe sumar 100%.");
            return;
        }
        setIsSaving(true);
        await saveStudyToFirestore(StudyStatus.Uploaded);
        if (currentStudy.id) {
            runReputationAnalysis(currentStudy.id).catch(console.error);
        }
        setIsSaving(false);
        setStep(AppStep.Summary);
    };

    const isEditMode = currentStudy.status && currentStudy.status !== StudyStatus.Draft;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Solicitud de Análisis Crediticio</h2>
                    <p className="text-sm text-gray-400 font-sans">Complete todos los campos para el envío a BigQuery.</p>
                </div>
                <button onClick={handleSaveProgress} disabled={isSaving} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-all shadow-lg font-sans">
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Guardar Borrador
                </button>
            </div>

            <FormSection title="1. Identificación de la Empresa" icon={Building2}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nombre Fiscal</label>
                        <Input value={datosGenerales.nombreEmpresa} onChange={(e) => updateQuestionnaire('datosGenerales', 'nombreEmpresa', toProperCase(e.target.value))} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">RFC</label>
                        <Input value={datosGenerales.rfc} onChange={(e) => updateQuestionnaire('datosGenerales', 'rfc', e.target.value.toUpperCase())} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Sector de Negocio</label>
                        <Select value={datosGenerales.sector} onChange={(e) => updateQuestionnaire('datosGenerales', 'sector', e.target.value)}>
                            <option value="">Seleccione Sector</option>
                            {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </div>
                </div>
            </FormSection>

            <FormSection title="2. Socios y Accionistas" icon={Users}>
                <div className="space-y-2 font-sans">
                    {accionistas.map((acc) => (
                        <div key={acc.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-8">
                                <Input placeholder="Nombre Legal" value={acc.nombre} onChange={e => updateArrayRow('accionistas', acc.id, 'nombre', toProperCase(e.target.value))} />
                            </div>
                            <div className="col-span-3">
                                <FinancialInput value={acc.participacion || 0} onChange={val => updateArrayRow('accionistas', acc.id, 'participacion', val)} suffix="%" />
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <button onClick={() => removeRow('accionistas', acc.id)} className="p-2 hover:bg-red-500/20 rounded-full group transition-colors"><Trash2 className="text-gray-600 group-hover:text-red-500" size={16} /></button>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between mt-4">
                        <button onClick={() => addRow('accionistas')} className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest"><PlusCircle size={14} /> Añadir Socio</button>
                        <div className={`text-xs font-bold flex items-center gap-2 ${isParticipationValid ? 'text-green-500' : 'text-red-400'}`}>
                            Total: {totalParticipation.toFixed(2)}%
                        </div>
                    </div>
                </div>
            </FormSection>

            <FormSection title="3. Principales Clientes" icon={Users}>
                <div className="space-y-2 font-sans">
                    {clientes.map((c) => (
                        <div key={c.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                                <Input placeholder="Nombre del Cliente" value={c.nombre} onChange={e => updateArrayRow('clientes', c.id, 'nombre', toProperCase(e.target.value))} />
                            </div>
                            <div className="col-span-4">
                                <Select value={c.sector} onChange={e => updateArrayRow('clientes', c.id, 'sector', e.target.value)}>
                                    <option value="">Sector</option>
                                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <FinancialInput value={c.diasPago} onChange={val => updateArrayRow('clientes', c.id, 'diasPago', val)} suffix="d" isInteger />
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <button onClick={() => removeRow('clientes', c.id)} className="p-2 hover:bg-red-500/20 rounded-full group transition-colors"><Trash2 className="text-gray-600 group-hover:text-red-500" size={16} /></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => addRow('clientes')} className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-2"><PlusCircle size={14} /> Añadir Cliente</button>
                </div>
            </FormSection>

            <FormSection title="4. Principales Proveedores" icon={Building2}>
                <div className="space-y-2 font-sans">
                    {proveedores.map((p) => (
                        <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                                <Input placeholder="Nombre del Proveedor" value={p.nombre} onChange={e => updateArrayRow('proveedores', p.id, 'nombre', toProperCase(e.target.value))} />
                            </div>
                            <div className="col-span-4">
                                <Select value={p.sector} onChange={e => updateArrayRow('proveedores', p.id, 'sector', e.target.value)}>
                                    <option value="">Sector</option>
                                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <FinancialInput value={p.diasPago} onChange={val => updateArrayRow('proveedores', p.id, 'diasPago', val)} suffix="d" isInteger />
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <button onClick={() => removeRow('proveedores', p.id)} className="p-2 hover:bg-red-500/20 rounded-full group transition-colors"><Trash2 className="text-gray-600 group-hover:text-red-500" size={16} /></button>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => addRow('proveedores')} className="text-blue-400 hover:text-blue-300 flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-2"><PlusCircle size={14} /> Añadir Proveedor</button>
                </div>
            </FormSection>

            <FormSection title="5. Detalles Financieros de la Solicitud" icon={Wallet}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-lg border-l-4 border-l-purple-600">
                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 font-sans">Monto Financiado (Sin IVA)</label>
                        <FinancialInput value={solicitud.monto} onChange={(v) => updateQuestionnaire('solicitud', 'monto', v)} prefix="$" isLarge />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-lg border-l-4 border-l-purple-600">
                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 font-sans">Número de Rentas (Plazo)</label>
                        <FinancialInput value={solicitud.plazo} onChange={(v) => updateQuestionnaire('solicitud', 'plazo', v)} suffix="m" isInteger isLarge />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-lg border-l-4 border-l-purple-600">
                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 font-sans">Tasa Nominal Anual</label>
                        <FinancialInput value={solicitud.tasaNominal} onChange={(v) => updateQuestionnaire('solicitud', 'tasaNominal', v)} suffix="%" isLarge />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-lg border-l-4 border-l-purple-600">
                        <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 font-sans">Renta Calculada</label>
                        <FinancialInput value={solicitud.renta} onChange={(v) => updateQuestionnaire('solicitud', 'renta', v)} prefix="$" isLarge />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-800 text-gray-400 text-[10px] uppercase font-bold tracking-widest font-sans">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-700">Concepto</th>
                                <th className="px-6 py-4 border-b border-slate-700">% o Nº de Veces</th>
                                <th className="px-6 py-4 border-b border-slate-700 text-right">Monto Calculado ($)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-sans">
                            <tr className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-300">Valor Residual</td>
                                <td className="px-6 py-4 w-48">
                                    <FinancialInput value={solicitud.residualPct} onChange={(v) => updateQuestionnaire('solicitud', 'residualPct', v)} suffix="%" />
                                </td>
                                <td className="px-6 py-4 text-right text-white text-lg font-bold">
                                    $ {formatCurrency(residualMonto)}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-300">Opción de Compra (OC)</td>
                                <td className="px-6 py-4 w-48">
                                    <FinancialInput value={solicitud.opcionCompraPct} onChange={(v) => updateQuestionnaire('solicitud', 'opcionCompraPct', v)} suffix="%" />
                                </td>
                                <td className="px-6 py-4 text-right text-white text-lg font-bold">
                                    $ {formatCurrency(ocMonto)}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-300">Depósito en Garantía</td>
                                <td className="px-6 py-4 w-48">
                                    <FinancialInput value={solicitud.depositoGarantiaPct || 0} onChange={(v) => updateQuestionnaire('solicitud', 'depositoGarantiaPct', v)} suffix="%" />
                                </td>
                                <td className="px-6 py-4 text-right text-white text-lg font-bold">
                                    $ {formatCurrency(depositoMonto)}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-300">Renta Anticipada</td>
                                <td className="px-6 py-4 w-48">
                                    <FinancialInput value={solicitud.rentaAnticipadaTimes} onChange={(v) => updateQuestionnaire('solicitud', 'rentaAnticipadaTimes', v)} suffix="v" isInteger />
                                </td>
                                <td className="px-6 py-4 text-right text-white text-lg font-bold">
                                    $ {formatCurrency(rentaAnticipadaMonto)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-purple-400 mb-1 uppercase tracking-wider">TIR (%)</label>
                        <FinancialInput value={solicitud.tir} onChange={(v) => updateQuestionnaire('solicitud', 'tir', v)} suffix="%" />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Tipo de Garantía</label>
                        <Select value={solicitud.garantia} onChange={(e) => updateQuestionnaire('solicitud', 'garantia', e.target.value)}>
                            <option value="">Seleccione Garantía</option>
                            {GARANTIAS.map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                    </div>
                </div>
            </FormSection>

            <FormSection title="6. Documentación Requerida (PDF)" icon={FileIcon}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-sans">
                    <FileUploadSlot 
                        label={`EF Anual ${annuals[0]}`} 
                        fileKey="estadosFinancierosAnual1" 
                        file={currentStudy.files.estadosFinancierosAnual1} 
                        onUpload={(e) => handleFileUpload(e, 'estadosFinancierosAnual1')} 
                        onRemove={() => removeStudyFile('estadosFinancierosAnual1')} 
                        isLoading={!!uploading.estadosFinancierosAnual1} 
                    />
                    <FileUploadSlot 
                        label={`EF Anual ${annuals[1]}`} 
                        fileKey="estadosFinancierosAnual2" 
                        file={currentStudy.files.estadosFinancierosAnual2} 
                        onUpload={(e) => handleFileUpload(e, 'estadosFinancierosAnual2')} 
                        onRemove={() => removeStudyFile('estadosFinancierosAnual2')} 
                        isLoading={!!uploading.estadosFinancierosAnual2} 
                    />
                    <FileUploadSlot 
                        label={`EF Anual ${annuals[2]}`} 
                        fileKey="estadosFinancierosAnual3" 
                        file={currentStudy.files.estadosFinancierosAnual3} 
                        onUpload={(e) => handleFileUpload(e, 'estadosFinancierosAnual3')} 
                        onRemove={() => removeStudyFile('estadosFinancierosAnual3')} 
                        isLoading={!!uploading.estadosFinancierosAnual3} 
                    />
                    <FileUploadSlot 
                        label={`EF Interino ${quarterLabelActual}`} 
                        fileKey="estadosFinancierosInterinoActual" 
                        file={currentStudy.files.estadosFinancierosInterinoActual} 
                        onUpload={(e) => handleFileUpload(e, 'estadosFinancierosInterinoActual')} 
                        onRemove={() => removeStudyFile('estadosFinancierosInterinoActual')} 
                        isLoading={!!uploading.estadosFinancierosInterinoActual} 
                    />
                    <FileUploadSlot 
                        label={`EF Interino ${quarterLabelComparativo}`} 
                        fileKey="estadosFinancierosInterinoComparativo" 
                        file={currentStudy.files.estadosFinancierosInterinoComparativo} 
                        onUpload={(e) => handleFileUpload(e, 'estadosFinancierosInterinoComparativo')} 
                        onRemove={() => removeStudyFile('estadosFinancierosInterinoComparativo')} 
                        isLoading={!!uploading.estadosFinancierosInterinoComparativo} 
                    />
                    <FileUploadSlot 
                        label="Anexos y Otros" 
                        fileKey="anexosPDF" 
                        file={currentStudy.files.anexosPDF} 
                        onUpload={(e) => handleFileUpload(e, 'anexosPDF')} 
                        onRemove={() => removeStudyFile('anexosPDF')} 
                        isLoading={!!uploading.anexosPDF} 
                    />
                </div>
            </FormSection>

            <div className="flex flex-col items-end gap-3 mt-10">
                {!isParticipationValid && (
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-950/20 px-4 py-2 rounded-lg border border-red-500/30 font-sans">
                        <AlertTriangle size={14} /> La participación accionaria debe sumar 100%
                    </div>
                )}
                <button
                    onClick={handleSend}
                    disabled={!isParticipationValid || isSaving}
                    className={`bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold py-4 px-10 rounded-xl flex items-center gap-3 transition-all shadow-xl shadow-purple-900/30 uppercase tracking-widest text-xs font-sans ${(!isParticipationValid || isSaving) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-purple-700/50'}`}
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    {isEditMode ? 'Guardar Cambios' : 'Enviar a Análisis'}
                </button>
            </div>
        </div>
    );
};

const FileUploadSlot: React.FC<{
    label: string;
    file: string | null | undefined;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    fileKey: string;
    isLoading: boolean;
}> = ({ label, file, onUpload, onRemove, fileKey, isLoading }) => {
    const inputId = `file-upload-${fileKey}`;
    return (
        <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700 h-32 flex flex-col justify-center relative hover:border-purple-500/50 transition-colors">
            <div className="mb-2 text-center">
                <label className="font-bold text-gray-500 text-[10px] uppercase tracking-tighter block truncate font-sans">{label}</label>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center text-purple-400"><Loader2 size={20} className="animate-spin" /></div>
            ) : file ? (
                <div className="bg-slate-800 p-2 rounded flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between w-full">
                        <FileIcon size={14} className="text-purple-400" />
                        <button onClick={onRemove}><Trash2 size={14} className="text-red-500 hover:text-red-400 transition-colors" /></button>
                    </div>
                    <a href={file} target="_blank" rel="noopener noreferrer" className="text-[9px] bg-purple-600 text-white text-center py-1 rounded font-bold uppercase tracking-widest mt-1 font-sans">Ver Archivo</a>
                </div>
            ) : (
                <label htmlFor={inputId} className="cursor-pointer border-2 border-dashed border-slate-700 rounded-md p-2 text-center block hover:border-purple-600 hover:bg-purple-600/5 transition-all flex flex-col justify-center items-center h-full">
                    <Upload className="text-gray-600 mb-1" size={16} />
                    <span className="text-[9px] text-gray-600 uppercase font-bold font-sans">Subir PDF</span>
                    <input id={inputId} type="file" className="hidden" onChange={onUpload} accept=".pdf" />
                </label>
            )}
        </div>
    );
};

export default Questionnaire;


export enum AppStep {
    Home,
    Dashboard,
    Questionnaire,
    Summary,
    Analysis,
    Report,
}

export enum UserRole {
    Admin = 'admin',
    Reviewer = 'reviewer',
    Requester = 'requester',
}

export enum StudyStatus {
    Draft = 'draft',
    Uploaded = 'uploaded',
    Processing = 'processing',
    PendingReview = 'pending_review',
    Corrected = 'corrected',
    Approved = 'approved',
    Rejected = 'rejected'
}

export interface UserData {
    uid: string;
    email: string;
    role: UserRole;
    name?: string;
    empresa?: string;
    rfc?: string;
    status: 'invited' | 'active';
    createdAt?: number;
}

export const SECTORES = [
    "ENERGÍA", "INDUSTRIAL", "MATERIALES", "PRODUCTOS DE CONSUMO FRECUENTE", 
    "SALUD", "SERVICIOS DE TELECOMUNICACIONES", "SERVICIOS FINANCIEROS", 
    "SERVICIOS PÚBLICOS", "SERVICIOS Y BIENES DE CONSUMO NO BÁSICO", 
    "TECNOLOGÍA DE LA INFORMACIÓN"
];

export const GARANTIAS = ["Sin garantía", "Fiduciaria", "Prendaria", "Hipotecaria"];

export interface Accionista {
    id: string;
    nombre: string;
    participacion: number;
}

export interface ClienteProveedor {
    id: string;
    nombre: string;
    sector: string; 
    diasPago: number;
}

export interface DatosGenerales {
    nombreEmpresa: string;
    rfc: string;
    sector: string;
}

export interface SolicitudCredito {
    monto: number;
    plazo: number; 
    renta: number; 
    residualPct: number;
    opcionCompraPct: number;
    gastosOriginacionPct: number;
    depositoGarantiaPct: number; 
    rentaAnticipadaTimes: number; 
    tasaNominal: number;
    tir: number;
    garantia: string;
}

export interface StudyFiles {
    estadosFinancierosAnual1: string | null; 
    estadosFinancierosAnual2: string | null; 
    estadosFinancierosAnual3: string | null; 
    estadosFinancierosInterinoActual: string | null; 
    estadosFinancierosInterinoComparativo: string | null; 
    estadosFinancierosInterinoAnterior: string | null; 
    anexosPDF?: string | null;
    [key: string]: string | null | undefined; 
}

export interface ReputationData {
    empresa: string;
    calificacion_reputacional: 'positiva' | 'neutral' | 'negativa';
    impacto_score_crediticio: string;
    impacto_score_num: number; 
    resumen_reputacional: string;
    riesgos: string[];
    oportunidades: string[];
    fuentes: string[];
}

export interface PerformanceYear {
    year: number;
    ingresos: number;
    costos: number;
    utilidades: number;
}

export interface Ratio {
    name: string;
    value: number;
    previousValue: number;
    interpretation: string;
}

export interface AnalysisData {
    riskScore: number;
    performance: PerformanceYear[];
    ratios: {
        liquidez: Ratio[];
        solvencia: Ratio[];
        rentabilidad: Ratio[];
        apalancamiento: Ratio[];
    };
    reputation?: ReputationData;
}

export interface Study {
    id?: string;
    ownerUid: string;
    empresaNombre: string;
    rfc: string;
    giro: string;
    status: StudyStatus;
    createdAt: number;
    updatedAt: number;
    questionnaire: {
        datosGenerales: DatosGenerales;
        accionistas: Accionista[];
        clientes: ClienteProveedor[];
        proveedores: ClienteProveedor[];
        solicitud: SolicitudCredito;
    };
    files: StudyFiles;
    reputationData?: ReputationData;
    analysisData?: AnalysisData;
}

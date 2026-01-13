
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Study, StudyStatus, UserData, UserRole, AnalysisData, StudyFiles, ReputationData, PerformanceYear } from '../types';
import { db, storage, auth, ref, uploadBytes, getDownloadURL, deleteObject } from '../firebase';
import * as firebaseAuth from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    deleteDoc, 
    updateDoc
} from 'firebase/firestore';

export interface User {
    uid: string;
    email: string | null;
    [key: string]: any;
}

const { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updatePassword
} = firebaseAuth as any;

const cleanObject = (obj: any): any => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
        if (newObj[key] === undefined) {
            delete newObj[key];
        } else if (newObj[key] !== null && typeof newObj[key] === 'object' && !Array.isArray(newObj[key])) {
            newObj[key] = cleanObject(newObj[key]);
        }
    });
    return newObj;
};

interface AppContextType {
    user: User | null;
    userData: UserData | null;
    isAuthLoading: boolean;
    logout: () => void;
    signUp: (email: string, pass: string) => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    updateUserPassword: (newPass: string) => Promise<void>;
    inviteUser: (email: string, role: UserRole) => Promise<void>;
    listUsers: () => Promise<UserData[]>;
    removeUser: (email: string) => Promise<void>;

    currentStudy: Study;
    setCurrentStudy: React.Dispatch<React.SetStateAction<Study>>;
    analysisData: AnalysisData | null;
    setAnalysisData: React.Dispatch<React.SetStateAction<AnalysisData | null>>;
    
    startNewStudy: () => void;
    loadStudy: (id: string) => Promise<boolean>;
    uploadStudyFile: (key: keyof StudyFiles, file: File) => Promise<void>;
    removeStudyFile: (key: keyof StudyFiles) => Promise<void>;
    saveStudyToFirestore: (status?: StudyStatus) => Promise<void>;
    resetStudyStatus: (id: string) => Promise<void>;
    
    isAppLoading: boolean;
    setIsAppLoading: (loading: boolean) => void;
    areStudiesLoading: boolean;
    studiesList: Study[];
    fetchStudies: () => Promise<void>;
    
    runSimulationPythonProcess: (id: string) => Promise<void>;
    runReputationAnalysis: (id: string) => Promise<void>;
    approveStudy: (id: string) => Promise<void>;
    rejectStudy: (id: string) => Promise<void>;

    makeApiKey: string;
    updateMakeApiKey: (key: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialStudyState: Study = {
    ownerUid: '',
    empresaNombre: '',
    rfc: '',
    giro: '',
    status: StudyStatus.Draft,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    questionnaire: {
        datosGenerales: { nombreEmpresa: '', rfc: '', sector: '' },
        accionistas: [{ id: crypto.randomUUID(), nombre: '', participacion: 0 }],
        clientes: [],
        proveedores: [],
        solicitud: {
            monto: 0, plazo: 0, renta: 0, residualPct: 0, opcionCompraPct: 0,
            gastosOriginacionPct: 0, depositoGarantiaPct: 0, rentaAnticipadaTimes: 0,
            tasaNominal: 0, tir: 0, garantia: ''
        }
    },
    files: {
        estadosFinancierosAnual1: null, estadosFinancierosAnual2: null, estadosFinancierosAnual3: null,
        estadosFinancierosInterinoActual: null, estadosFinancierosInterinoComparativo: null,
        estadosFinancierosInterinoAnterior: null, anexosPDF: null
    }
};

const N8N_WEBHOOK_URL = "https://creditiqmf.app.n8n.cloud/webhook-test/ef6bd6c9-f6e4-409c-ab87-646aa2bf1584";

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
    const [currentStudy, setCurrentStudy] = useState<Study>(initialStudyState);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [isAppLoading, setIsAppLoading] = useState<boolean>(false);
    const [areStudiesLoading, setAreStudiesLoading] = useState<boolean>(false);
    const [studiesList, setStudiesList] = useState<Study[]>([]);
    const [makeApiKey, setMakeApiKey] = useState<string>(() => localStorage.getItem('credit_iq_make_key') || 'Ebc201814');

    const abortControllerRef = useRef<AbortController | null>(null);

    const updateMakeApiKey = (key: string) => {
        setMakeApiKey(key);
        localStorage.setItem('credit_iq_make_key', key);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data() as UserData);
                    } else {
                        const newUserData: UserData = {
                            uid: currentUser.uid,
                            email: currentUser.email || '',
                            role: UserRole.Requester,
                            status: 'active',
                            createdAt: Date.now()
                        };
                        await setDoc(doc(db, "users", currentUser.uid), newUserData);
                        setUserData(newUserData);
                    }
                } catch (e) { console.error("Error fetching user data", e); }
            } else {
                setUserData(null);
                setStudiesList([]);
            }
            setIsAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => { await signInWithEmailAndPassword(auth, email, pass); };
    const signUp = async (email: string, pass: string) => {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        const newUserData: UserData = { uid: res.user.uid, email: email, role: UserRole.Requester, status: 'active', createdAt: Date.now() };
        await setDoc(doc(db, "users", res.user.uid), newUserData);
        setUserData(newUserData);
    };
    const logout = () => { signOut(auth); setCurrentStudy(initialStudyState); setAnalysisData(null); };
    const updateUserPassword = async (newPass: string) => { if (auth.currentUser) await updatePassword(auth.currentUser, newPass); };
    
    const inviteUser = async (email: string, role: UserRole) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const snap = await getDocs(q);
        if (!snap.empty) throw new Error("El usuario ya existe.");
        const newUserRef = doc(usersRef);
        await setDoc(newUserRef, { uid: newUserRef.id, email, role, status: 'invited', createdAt: Date.now() });
    };

    const listUsers = async () => {
        const snap = await getDocs(collection(db, "users"));
        return snap.docs.map(d => d.data() as UserData);
    };

    const removeUser = async (email: string) => {
        const q = query(collection(db, "users"), where("email", "==", email));
        const snap = await getDocs(q);
        const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    };

    const fetchStudies = useCallback(async () => {
        if (!user || !userData) return;
        setAreStudiesLoading(true);
        try {
            const studiesRef = collection(db, "credit-applications");
            let q;
            if (userData.role === UserRole.Admin || userData.role === UserRole.Reviewer) {
                q = query(studiesRef);
            } else {
                q = query(studiesRef, where("ownerUid", "==", user.uid));
            }
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Study));
            fetched.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setStudiesList(fetched);
        } catch (error: any) { console.error(error); } finally { setAreStudiesLoading(false); }
    }, [user, userData]);

    const startNewStudy = () => {
        setCurrentStudy({ ...initialStudyState, ownerUid: user?.uid || '' });
        setAnalysisData(null);
    };

    const loadStudy = async (id: string): Promise<boolean> => {
        setIsAppLoading(true);
        try {
            const docRef = doc(db, "credit-applications", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as Study;
                setCurrentStudy({ ...data, id: docSnap.id });
                if (data.analysisData) setAnalysisData(data.analysisData);
                return true;
            }
            return false;
        } catch (error) { return false; } finally { setIsAppLoading(false); }
    };

    const uploadStudyFile = async (key: keyof StudyFiles, file: File) => {
        if (!user) throw new Error("No autenticado");
        let appId = currentStudy.id;
        
        if (!appId) {
            const docRef = await addDoc(collection(db, "credit-applications"), cleanObject({ 
                ...currentStudy, 
                ownerUid: user.uid, 
                status: StudyStatus.Draft, 
                updatedAt: Date.now() 
            }));
            appId = docRef.id;
            setCurrentStudy(prev => ({ ...prev, id: appId }));
        }

        const storagePath = `${appId}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);

        const updatedFiles = { ...currentStudy.files, [key]: downloadUrl };
        setCurrentStudy(prev => ({ ...prev, files: updatedFiles }));
        await updateDoc(doc(db, "credit-applications", appId), { [`files.${key}`]: downloadUrl });
    };

    const removeStudyFile = async (key: keyof StudyFiles) => {
        const fileUrl = currentStudy.files[key];
        if (!fileUrl) return;

        try {
            const storageRef = ref(storage, fileUrl);
            await deleteObject(storageRef);
        } catch (e: any) {
            if (e.code !== 'storage/object-not-found') {
                console.error("Error al borrar de Storage:", e);
            }
        }

        const updatedFiles = { ...currentStudy.files, [key]: null };
        setCurrentStudy(prev => ({ ...prev, files: updatedFiles }));
        
        if (currentStudy.id) {
            await updateDoc(doc(db, "credit-applications", currentStudy.id), { [`files.${key}`]: null });
        }
    };

    const saveStudyToFirestore = async (newStatus?: StudyStatus) => {
        if (!user) return;
        setIsAppLoading(true);
        try {
            const studyAnalysis = analysisData || currentStudy.analysisData || null;
            const reputation = currentStudy.reputationData || null;
            
            const dataToSave = cleanObject({
                ...currentStudy,
                ownerUid: currentStudy.ownerUid || user.uid,
                updatedAt: Date.now(),
                empresaNombre: currentStudy.questionnaire.datosGenerales.nombreEmpresa,
                rfc: currentStudy.questionnaire.datosGenerales.rfc,
                giro: currentStudy.questionnaire.datosGenerales.sector,
                status: newStatus || currentStudy.status || StudyStatus.Draft,
                analysisData: studyAnalysis, 
                reputationData: reputation
            });

            if (currentStudy.id) {
                await setDoc(doc(db, "credit-applications", currentStudy.id), dataToSave, { merge: true });
            } else {
                const docRef = await addDoc(collection(db, "credit-applications"), dataToSave);
                setCurrentStudy({ ...dataToSave, id: docRef.id });
            }
            fetchStudies(); 
        } catch (error) { console.error(error); } finally { setIsAppLoading(false); }
    };

    const resetStudyStatus = async (id: string) => {
        // 1. ABORTO FÍSICO DE LA PETICIÓN HTTP
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 2. DESBLOQUEO LOCAL INSTANTÁNEO
        setCurrentStudy(prev => ({ ...prev, status: StudyStatus.Draft }));
        setIsAppLoading(false); 

        // 3. ACTUALIZACIÓN EN DB (en segundo plano)
        try {
            const studyRef = doc(db, "credit-applications", id);
            await updateDoc(studyRef, { 
                status: StudyStatus.Draft,
                updatedAt: Date.now() 
            });
            await fetchStudies();
        } catch (e) {
            console.error("Error al resetear estatus en DB:", e);
        }
    };

    const runReputationAnalysis = async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const impactNum = Math.floor(Math.random() * (20 - (-20) + 1) + (-20));
        const mockReputation: ReputationData = {
            empresa: currentStudy.empresaNombre || "Empresa Demo",
            calificacion_reputacional: impactNum > 5 ? 'positiva' : impactNum < -5 ? 'negativa' : 'neutral',
            impacto_score_crediticio: impactNum >= 0 ? `Positivo (+${impactNum} pts)` : `Negativo (${impactNum} pts)`,
            impacto_score_num: impactNum,
            resumen_reputacional: "Análisis corporativo muestra estabilidad en medios financieros.",
            riesgos: ["Presión competitiva sectorial."],
            oportunidades: ["Expansión digital detectada."],
            fuentes: ["Forbes", "El Economista"]
        };
        const studyRef = doc(db, "credit-applications", id);
        await updateDoc(studyRef, cleanObject({ reputationData: mockReputation }));
        setCurrentStudy(prev => ({ ...prev, reputationData: mockReputation }));
    };

    const runSimulationPythonProcess = async (id: string) => {
        if (!id) return;

        const studyRef = doc(db, "credit-applications", id);

        try {
            await updateDoc(studyRef, { 
                status: StudyStatus.Processing,
                updatedAt: Date.now() 
            });
            setCurrentStudy(prev => ({ ...prev, status: StudyStatus.Processing }));

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const timeoutId = setTimeout(() => controller.abort(), 15000); 

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_id: id,
                    timestamp: Date.now(),
                    empresa: currentStudy.empresaNombre,
                    rfc: currentStudy.rfc,
                    files: currentStudy.files,
                    questionnaire: currentStudy.questionnaire
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            abortControllerRef.current = null;

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Fallo de n8n (${response.status})`);
            }

            alert("✅ Señal enviada con éxito.");

        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.log("🛑 Proceso detenido por el usuario.");
                return;
            }
            console.error("Error n8n:", e);
            if (currentStudy.status === StudyStatus.Processing) {
                await updateDoc(studyRef, { status: StudyStatus.Draft });
                setCurrentStudy(prev => ({ ...prev, status: StudyStatus.Draft }));
                alert(`Error al conectar con n8n: ${e.message}`);
            }
        } finally {
            fetchStudies();
        }
    };

    const approveStudy = async (id: string) => {
        await updateDoc(doc(db, "credit-applications", id), { status: StudyStatus.Approved });
        setCurrentStudy(prev => ({ ...prev, status: StudyStatus.Approved }));
        fetchStudies();
    };

    const rejectStudy = async (id: string) => {
        await updateDoc(doc(db, "credit-applications", id), { status: StudyStatus.Rejected });
        setCurrentStudy(prev => ({ ...prev, status: StudyStatus.Rejected }));
        fetchStudies();
    };

    return (
        <AppContext.Provider value={{
            user, userData, isAuthLoading, logout, signUp, login, updateUserPassword, inviteUser, listUsers, removeUser,
            currentStudy, setCurrentStudy, analysisData, setAnalysisData,
            startNewStudy, loadStudy, uploadStudyFile, removeStudyFile, saveStudyToFirestore, resetStudyStatus,
            isAppLoading, setIsAppLoading, areStudiesLoading, studiesList, fetchStudies,
            runSimulationPythonProcess, runReputationAnalysis, approveStudy, rejectStudy,
            makeApiKey, updateMakeApiKey
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext error');
    return context;
};

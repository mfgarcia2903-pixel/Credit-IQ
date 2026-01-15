
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCASlZFDUEmy5f31rtEkfQK5vXUzwkZ_X0",
  authDomain: "credit-iq-22d5a.firebaseapp.com",
  projectId: "credit-iq-22d5a",
  storageBucket: "credit-iq-22d5a.firebasestorage.app",
  messagingSenderId: "62902722268",
  appId: "1:62902722268:web:3938d4227121d32a87de19"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { 
  app, 
  auth, 
  db, 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updatePassword
};

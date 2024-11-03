import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseApp = initializeApp({
    apiKey: "AIzaSyDXwcTsjy2sadptfCietLl5NokZswMyGuc",
    authDomain: "world-radio-de467.firebaseapp.com",
    databaseURL: "https://world-radio-de467-default-rtdb.firebaseio.com",
    projectId: "world-radio-de467",
    storageBucket: "world-radio-de467.firebasestorage.app",
    messagingSenderId: "1018931294205",
    appId: "1:1018931294205:web:d358f1090abee2c262f394",
    measurementId: "G-JNR3D63NM7"
});

const db = getFirestore(firebaseApp);

// Exporting Firestore utility functions to handle waypoints
export { db, collection, addDoc, getDocs };
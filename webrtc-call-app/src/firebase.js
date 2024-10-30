// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

//  TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMjYB3X_YfXY_pPo5XJl9BNzGhyZVNzKo",
  authDomain: "stt-slt.firebaseapp.com",
  projectId: "stt-slt",
  storageBucket: "stt-slt.appspot.com",
  messagingSenderId: "43291342744",
  appId: "1:43291342744:web:735f97618ef0f5d1231ded",
  measurementId: "G-YEXJVQV8ML"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore

export { db };
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Aapki real Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDom2T0KQyhOq82VaIf9wuzdPajrVt1rEY",
  authDomain: "dx-test-9a103.firebaseapp.com",
  databaseURL: "https://dx-test-9a103-default-rtdb.firebaseio.com",
  projectId: "dx-test-9a103",
  storageBucket: "dx-test-9a103.firebasestorage.app",
  messagingSenderId: "349561717807",
  appId: "1:349561717807:web:caa596d94b90f1c0cff2da",
  measurementId: "G-J4ME8T3YQW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);
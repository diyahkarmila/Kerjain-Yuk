import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4oeDGNzj2QdERlJUk3aogaBKsF0q_EAU",
  authDomain: "kerjainyuk-6f4d2.firebaseapp.com",
  databaseURL: "https://kerjainyuk-6f4d2-default-rtdb.firebaseio.com",
  projectId: "kerjainyuk-6f4d2",
  storageBucket: "kerjainyuk-6f4d2.firebasestorage.app",
  messagingSenderId: "1068661415340",
  appId: "1:1068661415340:web:462b64b0d00e9e9ec6ae09"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
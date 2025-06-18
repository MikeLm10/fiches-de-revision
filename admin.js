import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDFVYs8ndP38wcdJ0419d7ToTWmectToE",
    authDomain: "fiches-florimont.firebaseapp.com",
    projectId: "fiches-florimont",
    storageBucket: "fiches-florimont.appspot.com",
    messagingSenderId: "861008333499",
    appId: "1:861008333499:web:57bb7a0ec07b820164b47de",
    measurementId: "G-WDQ8BMJ5W5"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const passwordInput = document.getElementById("adminPassword");
const loginBtn = document.getElementById("adminLoginBtn");
const message = document.getElementById("loginMessage");

loginBtn.addEventListener("click", async () => {
  const entered = passwordInput.value.trim();
  if (!entered) {
    message.textContent = "Entrez un mot de passe.";
    return;
  }

  const snap = await getDoc(doc(db, "admin", "main"));
  if (!snap.exists()) {
    message.textContent = "Accès non configuré.";
    return;
  }

  const real = snap.data().password;
  if (entered === real) {
    message.style.color = "green";
    message.textContent = "Connexion réussie.";
    setTimeout(() => {
      location.href = "admin-panel.html";
    }, 800);
  } else {
    message.style.color = "red";
    message.textContent = "Mot de passe incorrect.";
  }
});

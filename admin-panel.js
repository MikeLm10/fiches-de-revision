import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

const pendingSection = document.getElementById("pendingFiches");
const sharedSection = document.getElementById("sharedFiches");

async function loadFiches() {
  // Fiches en attente
  const pendingQuery = query(collection(db, "fiches"), where("status", "==", "pending"));
  const pendingSnap = await getDocs(pendingQuery);
  pendingSection.innerHTML = "";
  if (pendingSnap.empty) {
    pendingSection.innerHTML = "<p style='color:#555;'>Aucune fiche en attente.</p>";
  } else {
    pendingSnap.forEach(docSnap => {
      const fiche = docSnap.data();
      const id = docSnap.id;
      const el = createFicheCard(fiche, id, "pending");
      pendingSection.appendChild(el);
    });
  }

  // Fiches validées
  const sharedQuery = query(collection(db, "shared"));
  const sharedSnap = await getDocs(sharedQuery);
  sharedSection.innerHTML = "";
  if (sharedSnap.empty) {
    sharedSection.innerHTML = "<p style='color:#555;'>Aucune fiche partagée.</p>";
  } else {
    sharedSnap.forEach(docSnap => {
      const fiche = docSnap.data();
      const id = docSnap.id;
      const el = createFicheCard(fiche, id, "shared");
      sharedSection.appendChild(el);
    });
  }
}

function createFicheCard(fiche, id, type) {
  const div = document.createElement("div");
  div.className = "card";
  div.style.marginBottom = "28px";

  div.innerHTML = `
    <h3>${fiche.chapter}</h3>
    <p><strong>${fiche.firstName} ${fiche.lastName}</strong> • ${fiche.subject} • ${fiche.grade} • ${fiche.pathway}</p>
    <div style="margin:10px 0; padding:10px 12px; background:#f4f4f4; border-radius:8px;">${fiche.content?.slice(0, 250).replace(/\n/g, "<br>") || ''}</div>

    <div style="margin: 12px 0; display:flex; gap:12px; flex-wrap:wrap;">
      ${type === "pending" ? `
        <button class="btn btn-secondary" onclick="validateFiche('${id}')">✅ Valider</button>
        <button class="btn btn-danger" onclick="deleteFiche('${id}', 'fiches')">🗑️ Supprimer</button>
      ` : `
        <button class="btn btn-danger" onclick="deleteFiche('${id}', 'shared')">🗑️ Supprimer</button>
        ${fiche.comments?.length ? `
          <div style="width:100%;margin-top:10px;">
            <strong>💬 Commentaires (${fiche.comments.length})</strong>
            <ul style="margin-top:6px;list-style:none;padding-left:0;">
              ${fiche.comments.map(c => `
                <li style="margin-bottom:10px;padding:8px;border:1px solid #ccc;border-radius:6px;">
                  <strong>${c.name}</strong> – <span style="font-size:0.85em;color:#777;">${c.date}</span><br/>
                  ${c.message}<br/>
                  <button class="btn btn-danger btn-small" style="margin-top:5px;" onclick='removeComment("${id}", ${JSON.stringify(c).replace(/"/g, "&quot;")})'>Supprimer</button>
                </li>
              `).join("")}
            </ul>
          </div>
        ` : "<p style='margin-top:8px;'>Aucun commentaire.</p>"}
      `}
    </div>
  `;
  return div;
}

window.validateFiche = async function(id) {
  const docRef = doc(db, "fiches", id);
  const ficheSnap = await getDocs(query(collection(db, "fiches"), where("__name__", "==", id)));
  if (ficheSnap.empty) return;

  const fiche = ficheSnap.docs[0].data();
  const sharedRef = doc(db, "shared", id);

  await updateDoc(sharedRef, { ...fiche, status: "validated" });
  await deleteDoc(docRef);

  loadFiches();
};

window.deleteFiche = async function(id, col) {
  if (confirm("Supprimer cette fiche ?")) {
    await deleteDoc(doc(db, col, id));
    loadFiches();
  }
};

window.removeComment = async function(ficheId, commentObj) {
  const ref = doc(db, "shared", ficheId);
  await updateDoc(ref, {
    comments: arrayRemove(commentObj)
  });
  loadFiches();
};

loadFiches();

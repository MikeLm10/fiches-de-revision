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
  setDoc,
  arrayRemove,
  onSnapshot
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
const pendingCount = document.getElementById("pendingFicheCount");
const sharedCount = document.getElementById("sharedFicheCount");

async function loadFiches() {
  const pendingSnap = await getDocs(query(collection(db, "fiches"), where("status", "==", "pending")));
  pendingSection.innerHTML = "";
  let pendingTotal = 0;

  if (pendingSnap.empty) {
    pendingSection.innerHTML = "<p style='color:#555;'>Aucune fiche en attente.</p>";
  } else {
    pendingSnap.forEach(docSnap => {
      const fiche = docSnap.data();
      const id = docSnap.id;
      const el = createFicheCard(fiche, id, "pending");
      pendingSection.appendChild(el);
      pendingTotal++;
    });
  }

  if (pendingCount) {
    pendingCount.textContent = `📊 ${pendingTotal} fiche${pendingTotal > 1 ? "s" : ""} en attente`;
  }

  const sharedSnap = await getDocs(collection(db, "shared"));
  sharedSection.innerHTML = "";
  let sharedTotal = 0;

  if (sharedSnap.empty) {
    sharedSection.innerHTML = "<p style='color:#555;'>Aucune fiche partagée.</p>";
  } else {
    sharedSnap.forEach(docSnap => {
      const fiche = docSnap.data();
      const id = docSnap.id;
      const el = createFicheCard(fiche, id, "shared");
      sharedSection.appendChild(el);
      sharedTotal++;
    });
  }

  if (sharedCount) {
    sharedCount.textContent = `📊 ${sharedTotal} fiche${sharedTotal > 1 ? "s" : ""} validée${sharedTotal > 1 ? "s" : ""}`;
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
  console.log("✅ Validation demandée pour la fiche :", id);
  const ficheRef = doc(db, "fiches", id);
  const ficheSnap = await getDocs(query(collection(db, "fiches"), where("__name__", "==", id)));

  if (ficheSnap.empty) {
    console.error("Fiche introuvable dans 'fiches'");
    return;
  }

  const fiche = ficheSnap.docs[0].data();
  const sharedRef = doc(db, "shared", id);

  await setDoc(sharedRef, {
    ...fiche,
    status: "validated",
    validatedAt: new Date().toISOString()
  });

  await deleteDoc(ficheRef);
  showToast("✅ Fiche validée !");
  loadFiches();
};

window.deleteFiche = async function(id, col) {
  if (confirm("Supprimer cette fiche ?")) {
    await deleteDoc(doc(db, col, id));
    showToast("🗑️ Fiche supprimée.");
    loadFiches();
  }
};

window.removeComment = async function(ficheId, commentObj) {
  await updateDoc(doc(db, "shared", ficheId), {
    comments: arrayRemove(commentObj)
  });
  showToast("💬 Commentaire supprimé.");
  loadFiches();
};

loadFiches();

onSnapshot(
  query(collection(db, "fiches"), where("status", "==", "pending")),
  snapshot => {
    if (!snapshot.empty) {
      showToast(`📥 Nouvelle fiche soumise !`);
    }
  }
);

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #00306b;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    font-size: 1rem;
    animation: fadein 0.5s, fadeout 0.5s 3s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

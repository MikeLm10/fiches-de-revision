import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";

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

const container = document.getElementById("sharedContainer");
const searchInput = document.getElementById("sharedSearchInput");
const sortSelect = document.getElementById("sharedSortSelect");
const showOnlyFavs = document.getElementById("showOnlyFavs");
if(showOnlyFavs) showOnlyFavs.addEventListener("change", filterAndSortSheets);

let approvedSheets = [];

function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function toggleFavorite(id) {
  let favs = getFavorites();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem("favorites", JSON.stringify(favs));
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

async function loadApprovedSheets() {
  const q = query(collection(db, "fiches"), where("status", "==", "approved"));
  const snapshot = await getDocs(q);
  approvedSheets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  filterAndSortSheets();
}

function displaySheets(sheets) {
  container.innerHTML = "";
  if (sheets.length === 0) {
    container.innerHTML = `<p class="empty-state">Aucune fiche disponible.</p>`;
    return;
  }

  sheets.forEach((sheet, idx) => {
    const div = document.createElement("div");
    div.className = "shared-sheet-card";
    div.style.animationDelay = (idx * 80) + "ms";
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div class="shared-sheet-title">${sheet.chapter}</div>
        <button class="fav-btn" data-id="${sheet.id}" aria-label="Ajouter aux favoris" style="background:none;border:none;font-size:1.65rem;cursor:pointer;margin-left:12px;">
          ★
        </button>
      </div>
      <div class="shared-sheet-meta">
        ${sheet.firstName ? sheet.firstName : ''} ${sheet.lastName ? sheet.lastName : ''} • 
        ${sheet.subject ? sheet.subject : ''} • 
        ${sheet.grade ? sheet.grade : ''} • 
        ${sheet.pathway ? sheet.pathway : ''}
      </div>
      <div class="shared-sheet-content">${(sheet.content || '').replace(/\n/g,"<br>")}</div>
      ${sheet.photos?.length ? renderPhotos(sheet.photos) : ""}
    `;
    div.onclick = () => openFicheModal(sheet); 
    container.appendChild(div);
  });

  container.querySelectorAll(".fav-btn").forEach(btn => {
    const id = btn.getAttribute("data-id");
    if (isFavorite(id)) {
      btn.style.color = "#FFD600";
      btn.title = "Retirer des favoris";
    } else {
      btn.style.color = "#BBB";
      btn.title = "Ajouter aux favoris";
    }
    btn.onclick = function(e) {
      e.stopPropagation();
      toggleFavorite(id);
      btn.style.color = isFavorite(id) ? "#FFD600" : "#BBB";
      btn.title = isFavorite(id) ? "Retirer des favoris" : "Ajouter aux favoris";
    }
  });
}


function renderPhotos(photos) {
  return `
    <div class="shared-sheet-photos">
      ${photos.map(url => `<img src="${url}" alt="Photo" onclick="openModal('${url}')">`).join("")}
    </div>
  `;
}

function filterAndSortSheets() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const onlyFav = showOnlyFavs && showOnlyFavs.checked;

  let filtered = approvedSheets;

  if (onlyFav) {
    const favs = getFavorites();
    filtered = filtered.filter(sheet => favs.includes(sheet.id));
  }

  if (searchValue) {
    filtered = filtered.filter(sheet =>
      (sheet.subject || '').toLowerCase().includes(searchValue) ||
      (sheet.chapter || '').toLowerCase().includes(searchValue) ||
      (sheet.firstName || '').toLowerCase().includes(searchValue) ||
      (sheet.lastName || '').toLowerCase().includes(searchValue)
    );
  }

  const sort = sortSelect.value;
  if (sort === "recent") {
    filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } else if (sort === "oldest") {
    filtered.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  } else if (sort === "subject") {
    filtered.sort((a, b) => (a.subject || "").localeCompare(b.subject || ""));
  } else if (sort === "pathway") {
    filtered.sort((a, b) => (a.pathway || "").localeCompare(b.pathway || ""));
  }

  displaySheets(filtered);
}



window.openModal = function (src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modalImg.src = src;
  modal.style.display = "flex";
};

window.closeModal = function () {
  document.getElementById("imageModal").style.display = "none";
};

window.openFicheModal = function(sheet) {
  const modal = document.getElementById("ficheModal");
  const content = document.getElementById("ficheModalContent");
  content.innerHTML = `
    <div style="padding:0 0 16px 0;">
      <h2 style="margin-bottom:12px;font-size:2rem;">${sheet.chapter}</h2>
      <div style="font-size:1.01rem;color:#666;margin-bottom:7px;">
        <b>${sheet.firstName ? sheet.firstName : ''} ${sheet.lastName ? sheet.lastName : ''}</b>
        • ${sheet.subject ? sheet.subject : ''} • ${sheet.grade ? sheet.grade : ''} • ${sheet.pathway ? sheet.pathway : ''}
      </div>
      <div style="background:#f3f4f6;border-radius:10px;padding:18px 12px;font-size:1.08rem;margin-bottom:12px;">${(sheet.content || '').replace(/\n/g,"<br>")}</div>
      ${sheet.photos?.length ? `
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px;">${
          sheet.photos.map(url=>`<img src="${url}" style="width:90px;height:90px;border-radius:7px;object-fit:cover;cursor:pointer;" onclick="window.open('${url}','_blank')" />`).join("")
        }</div>
      ` : ""}
      <button class="btn btn-small" style="margin-top:12px;" onclick='exportFichePDF(${JSON.stringify(sheet).replace(/'/g,"\\'").replace(/"/g,"&quot;")});event.stopPropagation();'>📄 Télécharger en PDF</button>
    </div>
  `;
  modal.style.display = "flex";
};

window.closeFicheModal = function() {
  document.getElementById("ficheModal").style.display = "none";
};

window.exportFichePDF = function(sheet) {
  const win = window.open('', '', 'height=700,width=800');
  win.document.write(`
    <html>
    <head>
      <title>${sheet.chapter}</title>
      <style>
        body { font-family: Arial,sans-serif; padding:30px;}
        h1 { color:#002f6c; border-bottom:2px solid #002f6c; padding-bottom:10px;}
        .meta { font-size:1.1em; margin-bottom:18px;}
        .content { background:#f3f4f6; padding:18px; border-radius:8px; font-size:1.13em;}
        img { max-width:100%; margin-top:16px; border-radius:10px;}
      </style>
    </head>
    <body>
      <h1>Fiche de Révision : ${sheet.chapter}</h1>
      <div class="meta">
        <b>Auteur :</b> ${sheet.firstName || ""} ${sheet.lastName || ""}<br>
        <b>Classe :</b> ${sheet.grade || ""} – ${sheet.subject || ""} – ${sheet.pathway || ""}<br>
        <b>Date :</b> ${sheet.timestamp ? new Date(sheet.timestamp).toLocaleDateString() : ""}
      </div>
      <div class="content">${(sheet.content || "").replace(/\n/g,'<br>')}</div>
      ${sheet.photos?.length ? sheet.photos.map(url => `<img src="${url}">`).join('') : ''}
    </body></html>
  `);
  win.document.close();
}


searchInput.addEventListener("input", filterAndSortSheets);
sortSelect.addEventListener("change", filterAndSortSheets);

loadApprovedSheets();

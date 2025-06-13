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

let approvedSheets = [];

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

  sheets.forEach(sheet => {
    const div = document.createElement("div");
    div.className = "sheet-card";
    div.innerHTML = `
      <h3 class="sheet-title">${sheet.subject} - ${sheet.chapter}</h3>
      <div class="sheet-meta">
        <span><strong>${sheet.firstName} ${sheet.lastName}</strong></span>
        <span>${sheet.grade} - ${sheet.pathway}</span>
        <span>${sheet.email}</span>
      </div>
      <div class="sheet-content">${sheet.content}</div>
      ${sheet.photos?.length ? renderPhotos(sheet.photos) : ""}
    `;
    container.appendChild(div);
  });
}

function renderPhotos(photos) {
  return `
    <div class="sheet-photos">
      ${photos.map(url => `<img src="${url}" onclick="openModal('${url}')">`).join("")}
    </div>
  `;
}

function filterAndSortSheets() {
  const searchValue = searchInput.value.trim().toLowerCase();
  let filtered = approvedSheets.filter(sheet =>
    sheet.subject?.toLowerCase().includes(searchValue) ||
    sheet.chapter?.toLowerCase().includes(searchValue) ||
    sheet.firstName?.toLowerCase().includes(searchValue) ||
    sheet.lastName?.toLowerCase().includes(searchValue)
  );

  const sort = sortSelect.value;
  if (sort === "recent") {
    filtered.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  } else if (sort === "oldest") {
    filtered.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
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

searchInput.addEventListener("input", filterAndSortSheets);
sortSelect.addEventListener("change", filterAndSortSheets);

loadApprovedSheets();

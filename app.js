import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dmi9cjnli/upload";
const CLOUDINARY_UPLOAD_PRESET = "site_fiche";

async function uploadPhotoToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData
  });
  if(!res.ok) throw new Error("Erreur upload image Cloudinary");
  const data = await res.json();
  return data.secure_url;
}

const firebaseConfig = {
  apiKey: "AIzaSyDFVYs8ndP38wcdJ0419d7ToTWmectToE",
  authDomain: "fiches-florimont.firebaseapp.com",
  projectId: "fiches-florimont",
  storageBucket: "fiches-florimont.appspot.com",
  messagingSenderId: "594088148387",
  appId: "1:594088148387:web:5d99f56b0b07ab16d3cdb1"
};

const appFirebase = initializeApp(firebaseConfig);
const db = getFirestore(appFirebase);

let isAdmin = false;

const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminPasswordInput = document.getElementById('adminPassword');
const loginContainer = document.getElementById('loginAdminContainer');
const logoutAdminBtn = document.getElementById('logoutAdminBtn');

async function tryAdminLogin(passwordTry) {
  const adminDocRef = doc(db, "admin", "main");
  const adminDocSnap = await getDoc(adminDocRef);
  if (adminDocSnap.exists()) {
    const data = adminDocSnap.data();
    return data.password === passwordTry;
  }
  return false;
}

function updateAdminUI() {
  if(loginContainer) loginContainer.style.display = isAdmin ? 'none' : 'block';
  if(logoutAdminBtn) logoutAdminBtn.style.display = isAdmin ? 'inline-block' : 'none';
  const pendingNavBtn = document.getElementById('pendingNavBtn');
  if (pendingNavBtn) pendingNavBtn.style.display = isAdmin ? 'inline-flex' : 'none';
}

if(adminLoginBtn) adminLoginBtn.onclick = async () => {
  const passwordTry = adminPasswordInput.value.trim();
  const isOk = await tryAdminLogin(passwordTry);
  if(isOk){
    isAdmin = true;
    adminPasswordInput.value = "";
    updateAdminUI();
    app.renderAll();
  } else {
    document.getElementById('loginMessage').textContent = "Mot de passe incorrect.";
    setTimeout(()=>{ document.getElementById('loginMessage').textContent = ""; }, 2000);
  }
};

if(logoutAdminBtn) logoutAdminBtn.onclick = () => {
  isAdmin = false;
  updateAdminUI();
  app.renderAll();
};

function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id + 'Section').style.display = 'block';
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.nav-btn[onclick="showSection('${id}')"]`).classList.add('active');
  if (id === 'pending') app.renderPending();
  else if (id === 'approved') app.renderApproved();
}
window.showSection = showSection;

function showImage(src) {
  document.getElementById('modalImage').src = src;
  document.getElementById('imageModal').style.display = 'flex';
}
window.showImage = showImage;

function closeModal() {
  document.getElementById('imageModal').style.display = 'none';
}
window.closeModal = closeModal;

function createPhotoPreview(files) {
  const preview = document.getElementById('photoPreview');
  if (!preview) return;
  preview.innerHTML = "";
  Array.from(files).forEach((file, idx) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const div = document.createElement('div');
      div.className = "photo-item";
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview" style="cursor:pointer;">
        <button class="photo-remove" data-index="${idx}">&times;</button>
      `;
      div.querySelector('img').onclick = function(ev) {
        ev.stopPropagation();
        document.getElementById('modalImage').src = e.target.result;
        document.getElementById('imageModal').style.display = 'flex';
      };
      div.querySelector('.photo-remove').onclick = function(ev) {
        ev.stopPropagation();
        removePhotoAtIndex(idx);
      };
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function removePhotoAtIndex(idx) {
  const input = document.getElementById('photoInput');
  const dt = new DataTransfer();
  const files = input.files;
  for(let i=0; i<files.length; i++){
    if(i !== idx) dt.items.add(files[i]);
  }
  input.files = dt.files;
  createPhotoPreview(dt.files);
}

class SheetApp {
  constructor() {
    this.setupForm();
    this.renderApproved();
    this.renderPending();
    this.setupFilters();
    this.setupPhotoPreview();
  }

  setupForm() {
    const form = document.getElementById('sheetForm') || document.getElementById('revisionForm');
    if(form){
      form.onsubmit = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('photoInput');
        const files = fileInput && fileInput.files ? fileInput.files : [];
        let photoURLs = [];
        if(files && files.length){
          for(let i=0; i<files.length; i++){
            const file = files[i];
            const url = await uploadPhotoToCloudinary(file);
            photoURLs.push(url);
          }
        }
        const data = {
          firstName: form.firstName.value.trim(),
          lastName: form.lastName.value.trim(),
          email: form.email.value.trim(),
          subject: form.subject.value.trim(),
          grade: form.grade.value.trim(),
          pathway: form.pathway.value.trim(),
          chapter: form.chapter.value.trim(),
          content: form.content.value.trim(),
          photos: photoURLs,
          status: "pending",
          timestamp: Date.now()
        };
        await addDoc(collection(db,"fiches"),data);
        form.reset();
        if(document.getElementById('photoPreview')) document.getElementById('photoPreview').innerHTML = "";
        if(document.getElementById('submitMessage')){
          document.getElementById('submitMessage').textContent = "Fiche envoyée !";
          setTimeout(()=>{document.getElementById('submitMessage').textContent = "";}, 2000);
        }
        this.renderPending();
      };
    }
  }

  setupPhotoPreview() {
    const input = document.getElementById('photoInput');
    if(input){
      input.onchange = function() {
        createPhotoPreview(input.files);
      };
      const photoUploadDiv = document.querySelector('.photo-upload');
      if(photoUploadDiv){
        photoUploadDiv.ondragover = function(e){ e.preventDefault(); photoUploadDiv.classList.add('dragover'); };
        photoUploadDiv.ondragleave = function(e){ e.preventDefault(); photoUploadDiv.classList.remove('dragover'); };
        photoUploadDiv.ondrop = function(e){
          e.preventDefault();
          photoUploadDiv.classList.remove('dragover');
          const dt = e.dataTransfer;
          if(dt && dt.files && dt.files.length){
            input.files = dt.files;
            createPhotoPreview(dt.files);
          }
        };
      }
    }
  }

  async renderApproved() {
    const container = document.getElementById('approvedContainer');
    if (!container) return;
    const q = query(collection(db, "fiches"), where("status", "==", "approved"));
    const snapshot = await getDocs(q);
    let sheets = [];
    snapshot.forEach(docSnap => {
      sheets.push({id: docSnap.id, ...docSnap.data()});
    });
    const search = document.getElementById('searchInput')?.value?.toLowerCase() || "";
    let sort = document.getElementById('sortSelect')?.value || "recent";
    if(search){
      sheets = sheets.filter(s =>
        (s.chapter+" "+s.content+" "+s.firstName+" "+s.lastName+" "+s.subject+" "+s.grade+" "+s.pathway)
        .toLowerCase().includes(search)
      );
    }
    if(sort==="recent") sheets.sort((a,b)=>b.timestamp-a.timestamp);
    else if(sort==="oldest") sheets.sort((a,b)=>a.timestamp-b.timestamp);
    else if(sort==="subject") sheets.sort((a,b)=>a.subject.localeCompare(b.subject));
    else if(sort==="pathway") sheets.sort((a,b)=>a.pathway.localeCompare(b.pathway));
    if(!sheets.length){
      container.innerHTML = `<p class="empty-state">Aucune fiche validée.</p>`;
      return;
    }
    container.innerHTML = "";
    sheets.forEach(s=>{
      container.innerHTML += `
        <div class="sheet-card">
          <div class="sheet-title">${s.chapter}</div>
          <div class="sheet-meta">
            ${s.firstName} ${s.lastName} – ${s.email} – ${s.subject} – ${s.grade} – ${s.pathway}</div>
          <div class="sheet-content">${s.content.replace(/\n/g,"<br>")}</div>
          ${s.photos?.length
            ? `<div class="sheet-photos">${s.photos.map(url =>
                `<img src="${url}" alt="Photo" onclick="showImage('${url}')">`
              ).join('')}</div>`
            : ''
          }
          <div class="sheet-actions">
            <button class="btn btn-small" onclick='app.exportPDF(${JSON.stringify(s).replace(/"/g,"&quot;")})'>Exporter PDF</button>
          </div>
        </div>`;
    });
  }

  async renderPending() {
    const container = document.getElementById('pendingContainer');
    if (!container) {
      console.log("Le container #pendingContainer n'existe pas !");
      return;
    }
    const q = query(collection(db, "fiches"), where("status", "==", "pending"));
    const snapshot = await getDocs(q);
    let sheets = [];
    snapshot.forEach(docSnap => {
      sheets.push({id: docSnap.id, ...docSnap.data()});
    });
    if(!sheets.length){
      container.innerHTML = `<p class="empty-state">Aucune fiche en attente.</p>`;
      return;
    }
    container.innerHTML = "";
    sheets.forEach(s=>{
      let actionsHtml = "";
      if(isAdmin){
        actionsHtml = `
          <button class="btn btn-small" onclick='app.approveSheet("${s.id}")'>Valider</button>
          <button class="btn btn-small" onclick='app.deleteSheet("${s.id}")'>Supprimer</button>
        `;
      }
      container.innerHTML += `
        <div class="sheet-card">
          <div class="sheet-title">${s.chapter}</div>
          <div class="sheet-meta">
            ${s.firstName} ${s.lastName} – ${s.email} – ${s.subject} – ${s.grade} – ${s.pathway}
          </div>
          <div class="sheet-content">${s.content.replace(/\n/g,"<br>")}</div>
          ${s.photos?.length
            ? `<div class="sheet-photos">${s.photos.map(url =>
                `<img src="${url}" alt="Photo" onclick="showImage('${url}')">`
              ).join('')}</div>`
            : ''
          }
          <div class="sheet-actions">
            ${actionsHtml}
            <button class="btn btn-small" onclick='app.exportPDF(${JSON.stringify(s).replace(/"/g,"&quot;")})'>Exporter PDF</button>
          </div>
        </div>`;
    });
  }

  async approveSheet(id) {
    await updateDoc(doc(db,"fiches",id), {status:"approved"});
    this.renderPending();
    this.renderApproved();
  }

  async deleteSheet(id) {
    if(confirm("Supprimer cette fiche ?")){
      await deleteDoc(doc(db,"fiches",id));
      this.renderPending();
      this.renderApproved();
    }
  }

  exportPDF(sheet) {
    const win = window.open('', '', 'height=700,width=800');
    win.document.write(`
      <html><head><title>${sheet.chapter}</title></head><body>
      <h1>${sheet.chapter}</h1>
      <p><strong>Auteur :</strong> ${sheet.firstName} ${sheet.lastName}</p>
      <p><strong>Classe :</strong> ${sheet.grade} – ${sheet.subject} – ${sheet.pathway}</p>
      <div>${sheet.content.replace(/\n/g,'<br>')}</div>
      ${sheet.photos?.length
        ? sheet.photos.map(url =>
            `<img src="${url}" alt="Photo" style="max-width:100%;height:auto;margin-top:10px;">`
          ).join('')
        : ''
      }
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  renderAll() {
    this.renderPending();
    this.renderApproved();
  }

  setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    if(searchInput) searchInput.oninput = ()=>this.renderApproved();
    if(sortSelect) sortSelect.onchange = ()=>this.renderApproved();
  }
}

window.app = new SheetApp();
updateAdminUI();

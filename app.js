import {
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged
  } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
  
  import {
    getFirestore,
    collection,
    doc,
    getDocs,
    updateDoc,
    deleteDoc,
    addDoc,
    query,
    where
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
  
  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  
  window.auth = auth;
  window.db = db;
  
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userEmailDisplay = document.getElementById("userEmail");
  const adminEmail = "j26883537@gmail.com";
  
  function login() {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider).catch((error) => {
      console.error("Erreur de connexion :", error);
    });
  }
  window.login = login;
  
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        const user = result.user;
        alert("Connecté en tant que " + user.email);
      }
    })
    .catch((error) => {
      console.error("Erreur après redirection :", error);
    });
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const email = user.email;
      console.log("🔐 Connecté :", email);
      userEmailDisplay.innerText = `Connecté en tant que ${email}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
  
      if (email === adminEmail) {
        document.getElementById("pendingSection").style.display = "block";
        document.querySelectorAll(".nav-btn").forEach(btn => {
          if (btn.innerText.includes("attente")) {
            btn.style.display = "inline-block";
          }
        });
      } else {
        console.warn("👤 Connecté mais non admin");
        document.getElementById("pendingSection").style.display = "none";
      }
    } else {
      console.log("🚪 Utilisateur non connecté");
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      userEmailDisplay.innerText = "";
      document.getElementById("pendingSection").style.display = "none";
    }
  });
  
  logoutBtn.addEventListener("click", () => {
    signOut(auth).catch((error) => {
      console.error("Erreur de déconnexion :", error);
    });
  });
  
  class SheetApp {
    constructor() {
      this.selectedPhotos = [];
      this.bindEvents();
      this.renderAll();
    }
  
    bindEvents() {
      document.getElementById('revisionForm').addEventListener('submit', e => this.submitSheet(e));
      document.getElementById('photoInput').addEventListener('change', e => this.handlePhotoSelect(e));
      document.getElementById('searchInput').addEventListener('input', () => this.renderApproved());
      document.getElementById('sortSelect').addEventListener('change', () => this.renderApproved());
  
      const uploadArea = document.querySelector('.photo-upload');
      uploadArea.addEventListener('dragover', e => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });
      uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
      uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        this.handlePhotoSelect({ target: { files: e.dataTransfer.files } });
      });
    }
  
    handlePhotoSelect(e) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          this.selectedPhotos.push({ name: file.name, data: event.target.result });
          this.updatePhotoPreview();
        };
        reader.readAsDataURL(file);
      });
    }
  
    updatePhotoPreview() {
      const preview = document.getElementById('photoPreview');
      preview.innerHTML = this.selectedPhotos.map((photo, index) => `
        <div class="photo-item">
          <img src="${photo.data}" alt="${photo.name}">
          <button type="button" class="photo-remove" onclick="app.removePhoto(${index})">×</button>
        </div>`).join('');
    }
  
    removePhoto(index) {
      this.selectedPhotos.splice(index, 1);
      this.updatePhotoPreview();
    }
  
    async submitSheet(e) {
      e.preventDefault();
      const sheet = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        pathway: document.getElementById('pathway').value,
        grade: document.getElementById('grade').value,
        subject: document.getElementById('subject').value,
        chapter: document.getElementById('chapter').value,
        content: document.getElementById('content').value,
        photos: [...this.selectedPhotos],
        date: new Date().toLocaleDateString('fr-FR'),
        status: "pending"
      };
  
      try {
        await addDoc(collection(db, "fiches"), sheet);
        alert("Fiche soumise avec succès ! Elle apparaîtra une fois validée.");
        e.target.reset();
        this.selectedPhotos = [];
        this.updatePhotoPreview();
        this.renderAll();
      } catch (error) {
        alert("Erreur lors de l'envoi de la fiche.");
        console.error(error);
      }
    }
  
    async approveSheet(docId, data) {
      await updateDoc(doc(db, "fiches", docId), { status: "approved" });
      await addDoc(collection(db, "shared"), data);
      this.renderAll();
    }
  
    async deleteSheet(docId) {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette fiche ?")) {
        await deleteDoc(doc(db, "fiches", docId));
        this.renderAll();
      }
    }
  
    async renderPending() {
      const container = document.getElementById('pendingContainer');
      const q = query(collection(db, "fiches"), where("status", "==", "pending"));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        container.innerHTML = '<p class="empty-state">Aucune fiche en attente.</p>';
        return;
      }
  
      container.innerHTML = '';
      snapshot.forEach(docSnap => {
        const s = docSnap.data();
        container.innerHTML += `
          <div class="sheet-card">
            <div class="sheet-title">${s.chapter}</div>
            <div class="sheet-meta">
              ${s.firstName} ${s.lastName} – ${s.email} – ${s.subject} – ${s.grade} – ${s.pathway} – ${s.date}
            </div>
            <div class="sheet-content">${s.content}</div>
            ${s.photos?.length ? `<div class="sheet-photos">${s.photos.map(p => `<img src="${p.data}" alt="photo">`).join('')}</div>` : ''}
            <div class="sheet-actions">
              <button class="btn btn-small" onclick='app.approveSheet("${docSnap.id}", ${JSON.stringify(s).replace(/"/g, "&quot;")})'>Valider</button>
              <button class="btn btn-small" onclick='app.deleteSheet("${docSnap.id}")'>Supprimer</button>
            </div>
          </div>`;
      });
    }
  
    async renderApproved() {
      const container = document.getElementById('approvedContainer');
      const search = document.getElementById('searchInput').value.toLowerCase();
      const sort = document.getElementById('sortSelect').value;
  
      const q = query(collection(db, "fiches"), where("status", "==", "approved"));
      const snapshot = await getDocs(q);
      let results = [];
      snapshot.forEach(docSnap => results.push(docSnap.data()));
  
      results = results.filter(s =>
        s.chapter.toLowerCase().includes(search) ||
        s.content.toLowerCase().includes(search) ||
        s.subject.toLowerCase().includes(search)
      );
  
      switch (sort) {
        case "recent": results.sort((a, b) => b.date.localeCompare(a.date)); break;
        case "oldest": results.sort((a, b) => a.date.localeCompare(b.date)); break;
        case "subject": results.sort((a, b) => a.subject.localeCompare(b.subject)); break;
        case "pathway": results.sort((a, b) => a.pathway.localeCompare(b.pathway)); break;
      }
  
      if (results.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune fiche trouvée.</p>';
        return;
      }
  
      container.innerHTML = results.map(s => `
        <div class="sheet-card">
          <div class="sheet-title">${s.chapter}</div>
          <div class="sheet-meta">
            ${s.firstName} ${s.lastName} – ${s.subject} – ${s.grade} – ${s.pathway} – ${s.date}
          </div>
          <div class="sheet-content">${s.content}</div>
          ${s.photos?.length ? `<div class="sheet-photos">${s.photos.map(p => `<img src="${p.data}" alt="photo" onclick="showImage('${p.data}')">`).join('')}</div>` : ''}
          <div class="sheet-actions">
            <button class="btn btn-small" onclick='app.exportPDF(${JSON.stringify(s).replace(/"/g, "&quot;")})'>Exporter PDF</button>
          </div>
        </div>`).join('');
    }
  
    exportPDF(sheet) {
      const win = window.open('', '', 'height=700,width=800');
      win.document.write(`
        <html><head><title>${sheet.chapter}</title></head><body>
        <h1>${sheet.chapter}</h1>
        <p><strong>Auteur :</strong> ${sheet.firstName} ${sheet.lastName}</p>
        <p><strong>Classe :</strong> ${sheet.grade} – ${sheet.subject} – ${sheet.pathway}</p>
        <p><strong>Date :</strong> ${sheet.date}</p>
        <div>${sheet.content.replace(/\n/g, '<br>')}</div>
        </body></html>
      `);
      win.document.close();
      win.print();
    }
  
    renderAll() {
      this.renderPending();
      this.renderApproved();
    }
  }
  
  function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(id + 'Section').style.display = 'block';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[onclick="showSection('${id}')"]`).classList.add('active');
  }
  
  function showImage(src) {
    document.getElementById('modalImage').src = src;
    document.getElementById('imageModal').style.display = 'flex';
  }
  
  function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
  }
  
  const app = new SheetApp();
  
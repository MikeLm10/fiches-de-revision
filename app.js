class SheetApp {
    constructor() {
      this.pending = JSON.parse(localStorage.getItem('pendingSheets') || '[]');
      this.approved = JSON.parse(localStorage.getItem('approvedSheets') || '[]');
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
  
    submitSheet(e) {
      e.preventDefault();
      const sheet = {
        id: Date.now(),
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
      this.pending.push(sheet);
      this.savePending();
      this.renderPending();
      e.target.reset();
      this.selectedPhotos = [];
      this.updatePhotoPreview();
      alert("Fiche soumise avec succès ! Elle apparaîtra une fois validée.");
    }
  
    approveSheet(id) {
      const sheet = this.pending.find(s => s.id === id);
      if (sheet) {
        this.approved.push(sheet);
        this.pending = this.pending.filter(s => s.id !== id);
        this.saveApproved();
        this.savePending();
        this.renderAll();
      }
    }
  
    editSheet(id) {
      const sheet = this.pending.find(s => s.id === id);
      const newContent = prompt("Modifier le contenu de la fiche :", sheet.content);
      if (newContent !== null) {
        sheet.content = newContent + " (modifié - à revalider)";
        this.savePending();
        this.renderPending();
      }
    }
  
    deleteSheet(id) {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette fiche ?")) {
        this.pending = this.pending.filter(s => s.id !== id);
        this.savePending();
        this.renderPending();
      }
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
  
    savePending() {
      localStorage.setItem('pendingSheets', JSON.stringify(this.pending));
    }
  
    saveApproved() {
      localStorage.setItem('approvedSheets', JSON.stringify(this.approved));
    }
  
    renderPending() {
      const container = document.getElementById('pendingContainer');
      if (this.pending.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune fiche en attente.</p>';
        return;
      }
      container.innerHTML = this.pending.map(s => `
        <div class="sheet-card">
          <div class="sheet-title">${s.chapter}</div>
          <div class="sheet-meta">
            ${s.firstName} ${s.lastName} – ${s.email} – ${s.subject} – ${s.grade} – ${s.pathway} – ${s.date}
          </div>
          <div class="sheet-content">${s.content}</div>
          ${s.photos?.length ? `<div class="sheet-photos">${s.photos.map(p => `<img src="${p.data}" alt="photo">`).join('')}</div>` : ''}
          <div class="sheet-actions">
            <button class="btn btn-small" onclick="app.approveSheet(${s.id})">Valider</button>
            <button class="btn btn-small" onclick="app.editSheet(${s.id})">Modifier</button>
            <button class="btn btn-small" onclick="app.deleteSheet(${s.id})">Supprimer</button>
          </div>
        </div>`).join('');
    }
  
    renderApproved() {
      const container = document.getElementById('approvedContainer');
      const search = document.getElementById('searchInput').value.toLowerCase();
      const sort = document.getElementById('sortSelect').value;
  
      let filtered = this.approved.filter(s =>
        s.chapter.toLowerCase().includes(search) ||
        s.content.toLowerCase().includes(search) ||
        s.subject.toLowerCase().includes(search)
      );
  
      switch (sort) {
        case "recent": filtered.sort((a, b) => b.id - a.id); break;
        case "oldest": filtered.sort((a, b) => a.id - b.id); break;
        case "subject": filtered.sort((a, b) => a.subject.localeCompare(b.subject)); break;
        case "pathway": filtered.sort((a, b) => a.pathway.localeCompare(b.pathway)); break;
      }
  
      if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune fiche trouvée.</p>';
        return;
      }
  
      container.innerHTML = filtered.map(s => `
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
  
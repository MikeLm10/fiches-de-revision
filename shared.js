function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
  }
  
  function showImage(src) {
    document.getElementById('modalImage').src = src;
    document.getElementById('imageModal').style.display = 'flex';
  }
  
  function exportPDF(sheet) {
    const win = window.open('', '', 'height=700,width=800');
    win.document.write(`
      <html>
        <head>
          <title>Fiche - ${sheet.chapter}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #6366f1; }
            .meta { color: #666; margin-bottom: 20px; }
            .content { line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${sheet.chapter}</h1>
          <div class="meta">
            <strong>Auteur:</strong> ${sheet.firstName} ${sheet.lastName}<br>
            <strong>Section:</strong> ${sheet.pathway} • ${sheet.grade} • ${sheet.subject}<br>
            <strong>Date:</strong> ${sheet.date}
          </div>
          <div class="content">${sheet.content.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  }
  
  function renderShared() {
    const container = document.getElementById('sharedContainer');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const sort = document.getElementById('sortSelect').value;
  
    db.collection("fiches").where("status", "==", "approved").get().then(snapshot => {
      let sheets = [];
      snapshot.forEach(doc => sheets.push({ id: doc.id, ...doc.data() }));
  
      let filtered = sheets.filter(s =>
        s.chapter.toLowerCase().includes(search) ||
        s.content.toLowerCase().includes(search) ||
        s.subject.toLowerCase().includes(search) ||
        s.pathway.toLowerCase().includes(search)
      );
  
      switch (sort) {
        case "recent": filtered.sort((a, b) => b.id - a.id); break;
        case "oldest": filtered.sort((a, b) => a.id - b.id); break;
        case "subject": filtered.sort((a, b) => a.subject.localeCompare(b.subject)); break;
        case "pathway": filtered.sort((a, b) => a.pathway.localeCompare(b.pathway)); break;
      }
  
      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <h3>Aucune fiche trouvée</h3>
            <p>Essayez de modifier les critères de recherche</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = filtered.map(s => `
        <div class="sheet-card">
          <div class="sheet-title">${s.chapter}</div>
          <div class="sheet-meta">
            <span class="meta-item">${s.firstName} ${s.lastName}</span>
            <span class="meta-item">${s.pathway}</span>
            <span class="meta-item">${s.grade}</span>
            <span class="meta-item">${s.subject}</span>
            <span class="meta-item">${s.date}</span>
          </div>
          <div class="sheet-content">${s.content}</div>
          ${s.photos?.length ? `
            <div class="sheet-photos">
              ${s.photos.map(photo => `
                <img src="${photo.data}" alt="${photo.name}" onclick="showImage('${photo.data}')">
              `).join('')}
            </div>` : ''}
          <div class="sheet-actions">
            <button class="btn btn-small" onclick='exportPDF(${JSON.stringify(s).replace(/"/g, '&quot;')})'>Exporter PDF</button>
          </div>
        </div>
      `).join('');
    });
  }
  
  document.getElementById('searchInput').addEventListener('input', renderShared);
  document.getElementById('sortSelect').addEventListener('change', renderShared);
  
  renderShared();
  
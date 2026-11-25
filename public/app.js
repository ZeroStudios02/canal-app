const API = '';

// Navegación entre pestañas
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    cargarTabla(btn.dataset.tab);
  });
});

// Cargar datos de una pestaña
async function cargarTabla(tab) {
  if (tab === 'dibujos') {
    const res = await fetch(API + '/api/dibujos');
    const dibujos = await res.json();
    const cont = document.getElementById('lista-dibujos');
    cont.innerHTML = '';
    if (dibujos.length === 0) { cont.innerHTML = '<div class="empty">Sin dibujos aún.</div>'; return; }
    dibujos.forEach(d => {
      cont.innerHTML += `
        <div class="card">
          <img src="${d.portada || 'https://via.placeholder.com/300x180?text=Sin+imagen'}" alt="${d.titulo}">
          <h3>${d.titulo}</h3>
          <p>${d.descripcion || 'Sin descripción'}</p>
          <button onclick="verEpisodios(${d.id}, '${d.titulo}')" class="btn-add" style="width:100%;background:#475569;">Ver episodios</button>
          <button class="btn-delete" onclick="borrarDibujo(${d.id})">Eliminar</button>
        </div>`;
    });
  } else if (tab === 'musica') {
    const res = await fetch(API + '/api/musica');
    const canciones = await res.json();
    const cont = document.getElementById('lista-musica');
    cont.innerHTML = '';
    if (canciones.length === 0) { cont.innerHTML = '<div class="empty">Sin canciones aún.</div>'; return; }
    canciones.forEach(c => {
      cont.innerHTML += `
        <div class="card">
          <img src="${c.portada || 'https://via.placeholder.com/300x180?text=Sin+imagen'}" alt="${c.titulo}">
          <h3>${c.titulo}</h3>
          <p>${c.artista || 'Artista desconocido'} ${c.album ? '· ' + c.album : ''}</p>
          <audio controls src="${c.audio_url}" style="width:100%;margin-top:0.5rem;"></audio>
          <button class="btn-delete" onclick="borrarMusica(${c.id})">Eliminar</button>
        </div>`;
    });
  } else if (tab === 'eventos') {
    const res = await fetch(API + '/api/eventos');
    const eventos = await res.json();
    const cont = document.getElementById('lista-eventos');
    cont.innerHTML = '';
    if (eventos.length === 0) { cont.innerHTML = '<div class="empty">Sin eventos aún.</div>'; return; }
    eventos.forEach(e => {
      cont.innerHTML += `
        <div class="card">
          ${e.imagen ? `<img src="${e.imagen}" alt="${e.titulo}">` : ''}
          <h3>${e.titulo}</h3>
          <p>${e.descripcion || 'Sin descripción'}</p>
          <span>📅 ${new Date(e.fecha).toLocaleString('es-ES')}</span>
          <button class="btn-delete" onclick="borrarEvento(${e.id})">Eliminar</button>
        </div>`;
    });
  }
}

// Ver episodios de un dibujo
async function verEpisodios(id, titulo) {
  const res = await fetch(API + '/api/dibujos/' + id + '/episodios');
  const eps = await res.json();
  document.getElementById('detalle-titulo').textContent = titulo;
  const cont = document.getElementById('detalle-episodios');
  cont.innerHTML = '';
  if (eps.length === 0) { cont.innerHTML = '<p>Sin episodios.</p>'; }
  else {
    eps.forEach(e => {
      cont.innerHTML += `
        <div class="episode">
          <strong>${e.numero ? 'Episodio ' + e.numero + ' · ' : ''}${e.titulo}</strong>
          <span>${e.duracion || ''}</span>
          <button onclick="abrirVideo('${e.video_url}')" class="btn-add" style="width:100%;background:#475569;margin-top:0.5rem;">Reproducir</button>
        </div>`;
    });
  }
  document.getElementById('modal-detalle').classList.add('active');
}

function abrirVideo(url) {
  window.open(url, '_blank');
}

// Modal genérico
function abrirModal(id) { document.getElementById(id).classList.add('active'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('active'); }

// Formularios
document.getElementById('form-dibujo').onsubmit = async (e) => {
  e.preventDefault();
  await fetch(API + '/api/dibujos', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      titulo: document.getElementById('dibujo-titulo').value,
      descripcion: document.getElementById('dibujo-desc').value,
      portada: document.getElementById('dibujo-portada').value
    })
  });
  cerrarModal('modal-dibujo');
  e.target.reset();
  cargarTabla('dibujos');
};

document.getElementById('form-musica').onsubmit = async (e) => {
  e.preventDefault();
  await fetch(API + '/api/musica', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      titulo: document.getElementById('musica-titulo').value,
      artista: document.getElementById('musica-artista').value,
      audio_url: document.getElementById('musica-audio').value,
      portada: document.getElementById('musica-portada').value
    })
  });
  cerrarModal('modal-musica');
  e.target.reset();
  cargarTabla('musica');
};

document.getElementById('form-evento').onsubmit = async (e) => {
  e.preventDefault();
  await fetch(API + '/api/eventos', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      titulo: document.getElementById('evento-titulo').value,
      descripcion: document.getElementById('evento-desc').value,
      fecha: document.getElementById('evento-fecha').value,
      imagen: document.getElementById('evento-imagen').value
    })
  });
  cerrarModal('modal-evento');
  e.target.reset();
  cargarTabla('eventos');
};

// Borrar
async function borrarDibujo(id) {
  if (!confirm('¿Eliminar este dibujo y sus episodios?')) return;
  await fetch(API + '/api/dibujos/' + id, { method: 'DELETE' });
  cargarTabla('dibujos');
}
async function borrarMusica(id) {
  if (!confirm('¿Eliminar esta canción?')) return;
  await fetch(API + '/api/musica/' + id, { method: 'DELETE' });
  cargarTabla('musica');
}
async function borrarEvento(id) {
  if (!confirm('¿Eliminar este evento?')) return;
  await fetch(API + '/api/eventos/' + id, { method: 'DELETE' });
  cargarTabla('eventos');
}

// Abrir modales específicos
function abrirModalDibujo() { abrirModal('modal-dibujo'); }
function abrirModalMusica() { abrirModal('modal-musica'); }
function abrirModalEvento() { abrirModal('modal-evento'); }

// Cerrar modal al hacer clic fuera
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('active'); });
});

// Cargar pestaña inicial
cargarTabla('dibujos');
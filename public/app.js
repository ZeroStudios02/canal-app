const API = '';

// Navegación entre pestañas
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    cargarTabla(btn.dataset.tab);
  });
});

// Cargar datos de una pestaña
async function cargarTabla(tab) {
  if (tab === 'musica') {
    const res = await fetch(API + '/api/musica');
    const canciones = await res.json();
    const cont = document.getElementById('lista-musica');
    cont.innerHTML = '';
    if (canciones.length === 0) {
      cont.innerHTML = '<div class="empty">Sin canciones aún. Añade tu primera música.</div>';
      return;
    }
    canciones.forEach(c => {
      cont.innerHTML += `
        <div class="music-card">
          <div class="music-art">${c.titulo.charAt(0).toUpperCase()}</div>
          <h3>${c.titulo}</h3>
          <span class="music-artist">${c.artista || 'Artista desconocido'} ${c.album ? '· ' + c.album : ''}</span>
          <audio controls src="${c.audio_url}" style="width:100%;margin-top:0.5rem;"></audio>
        </div>`;
    });
  } else if (tab === 'eventos') {
    const res = await fetch(API + '/api/eventos');
    const eventos = await res.json();
    const cont = document.getElementById('lista-eventos');
    cont.innerHTML = '';
    if (eventos.length === 0) {
      cont.innerHTML = '<div class="empty">Sin eventos aún. Añade tu primer evento.</div>';
      return;
    }
    eventos.forEach(e => {
      const fecha = new Date(e.fecha);
      cont.innerHTML += `
        <div class="event-card">
          <div class="event-date">
            <div class="day">${fecha.getDate()}</div>
            <div class="month">${fecha.toLocaleString('es-ES', { month: 'short' })}</div>
          </div>
          <div class="event-info">
            <h3>${e.titulo}</h3>
            <p>${e.descripcion || 'Sin descripción'}</p>
            <span class="time">📅 ${fecha.toLocaleString('es-ES')}</span>
          </div>
        </div>`;
    });
  }
}

// Cargar pestaña inicial
cargarTabla('musica');

// Canvas animado de fondo (partículas)
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let width, height, particles = [];

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
  constructor() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 2 + 1;
    this.color = Math.random() > 0.5 ? '#00f2ff' : '#7000ff';
    this.alpha = Math.random() * 0.5 + 0.1;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

for (let i = 0; i < 40; i++) particles.push(new Particle());

function animate() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => { p.update(); p.draw(); });
  // Líneas entre partículas cercanas
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 150) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animate);
}
animate();
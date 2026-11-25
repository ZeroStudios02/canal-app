const API = '';

// Estado de la radio
let songs = [];
let shuffledOrder = [];
let currentIndex = 0;
let audio = new Audio();
let audioStarted = false;
let synth = window.speechSynthesis;
let voices = [];
let currentUtterance = null;

// Fecha de fin de temporada (tipo Fortnite) - 30 días desde ahora
const SEASON_END = new Date();
SEASON_END.setDate(SEASON_END.getDate() + 30);

// Letras generadas dinámicamente
function generateLyrics(title, artist) {
  const phrases = [
    `Sintoniza ${title}`,
    `${artist} en Canal Stream Radio`,
    'Música para tu momento',
    'La radio que te acompaña',
    'Sonido en vivo, las 24 horas',
    'Disfruta la transmisión',
    'Canal Stream, siempre contigo',
    'El mejor sonido para hoy',
    'Déjate llevar por la música',
    'Tu radio, tu momento'
  ];
  return phrases.map((t, i) => ({ t: i * 8, text: t }));
}

// Cargar canciones
async function loadSongs() {
  try {
    const res = await fetch(API + '/api/musica');
    songs = await res.json();
    if (songs.length > 0) {
      shufflePlaylist();
      mostrarBotonPlay();
    }
  } catch (e) {
    console.error('Error cargando canciones:', e);
  }
}

// Mezclar playlist
function shufflePlaylist() {
  shuffledOrder = [...songs].sort(() => Math.random() - 0.5);
  currentIndex = 0;
}

// Mostrar botón de reproducción
function mostrarBotonPlay() {
  const container = document.querySelector('.radio-player');
  if (document.getElementById('btn-play-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'btn-play-overlay';
  overlay.className = 'btn-play-overlay';
  overlay.innerHTML = `
    <div class="btn-play-content">
      <div class="btn-play-icon">▶️</div>
      <div class="btn-play-text">REPRODUCIR RADIO</div>
      <div class="btn-play-sub">Haz clic para iniciar la transmisión en vivo</div>
    </div>
  `;
  container.appendChild(overlay);

  overlay.addEventListener('click', () => {
    audio.muted = false;
    startRadio();
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
  });
}

// Iniciar radio
function startRadio() {
  if (songs.length === 0) return;
  playSong(currentIndex);
  audioStarted = true;
}

// Reproducir canción
function playSong(index) {
  if (index < 0 || index >= shuffledOrder.length) {
    shufflePlaylist();
    index = 0;
  }
  currentIndex = index;
  const song = shuffledOrder[currentIndex];

  document.getElementById('np-title').textContent = 'Canal Stream Radio';
  document.getElementById('np-artist').textContent = 'Emisión en vivo';
  document.getElementById('disk-cover').textContent = song.titulo.charAt(0).toUpperCase();
  document.getElementById('lyric-text').textContent = song.titulo.toUpperCase();
  document.getElementById('song-lyric').textContent = 'Iniciando transmisión...';

  const disk = document.getElementById('np-disk');
  disk.classList.add('spinning');

  speak('Nueva canción en Canal Stream Radio');

  const locutorMsgs = [
    'Disfruta de esta transmisión',
    'La mejor música para tu momento',
    'Sigue sintonizado, viene lo mejor',
    'Canal Stream Radio, siempre contigo',
    'Déjate llevar por el sonido',
    'Tu radio, tu compañía'
  ];
  const randomMsg = locutorMsgs[Math.floor(Math.random() * locutorMsgs.length)];
  document.getElementById('locutor-text').textContent = randomMsg;
  setTimeout(() => speak(randomMsg), 1000);

  audio.src = song.audio_url;
  audio.crossOrigin = 'anonymous';
  audio.muted = false;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.warn('Error reproduciendo:', err);
      document.getElementById('song-lyric').textContent = 'Error de reproducción. Intenta de nuevo.';
    });
  }

  const lyrics = generateLyrics(song.titulo, song.artista);
  let lyricIdx = 0;

  const updateLyric = () => {
    const ct = audio.currentTime;
    while (lyricIdx < lyrics.length && lyrics[lyricIdx].t <= ct) {
      const el = document.getElementById('song-lyric');
      el.classList.add('fade');
      setTimeout(() => {
        el.textContent = lyrics[lyricIdx].text;
        el.classList.remove('fade');
      }, 400);
      document.getElementById('lyric-text').textContent = lyrics[lyricIdx].text.toUpperCase();
      lyricIdx++;
    }
  };

  const updateProgress = () => {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100 || 0;
      document.getElementById('progress-fill').style.width = pct + '%';
      document.getElementById('time-current').textContent = formatTime(audio.currentTime);
      document.getElementById('time-duration').textContent = formatTime(audio.duration);
    }
  };

  audio.ontimeupdate = () => { updateLyric(); updateProgress(); };

  audio.onended = () => {
    disk.classList.remove('spinning');
    speak('Siguiente canción en Canal Stream Radio');
    playSong(currentIndex + 1);
  };

  audio.onerror = () => {
    console.warn('Error cargando canción, pasando a la siguiente...');
    disk.classList.remove('spinning');
    setTimeout(() => playSong(currentIndex + 1), 2000);
  };
}

function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function speak(text) {
  if (currentUtterance) synth.cancel();
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'es-ES';
  currentUtterance.rate = 1.0;
  currentUtterance.volume = 0.7;
  if (voices.length > 0) {
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) currentUtterance.voice = esVoice;
  }
  synth.speak(currentUtterance);
}

function loadVoices() {
  voices = synth.getVoices();
}

// Contador tipo Fortnite
function updateSeasonCounter() {
  const now = new Date().getTime();
  const diff = SEASON_END.getTime() - now;

  if (diff <= 0) {
    document.getElementById('season-status').textContent = '¡La temporada ha terminado!';
    document.getElementById('counter-days').textContent = '00';
    document.getElementById('counter-hours').textContent = '00';
    document.getElementById('counter-minutes').textContent = '00';
    document.getElementById('counter-seconds').textContent = '00';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('counter-days').textContent = String(days).padStart(2, '0');
  document.getElementById('counter-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('counter-minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('counter-seconds').textContent = String(seconds).padStart(2, '0');
}

setInterval(updateSeasonCounter, 1000);
updateSeasonCounter();

// Visualizador de audio
function initVisualizer() {
  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d');
  let width, height, bars = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = 400;
    bars = Array.from({ length: 60 }, () => ({
      h: Math.random() * 50 + 20,
      target: Math.random() * 50 + 20,
      color: Math.random() > 0.5 ? '#e50914' : '#00f2ff'
    }));
  }
  window.addEventListener('resize', resize);
  resize();

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const barWidth = 6;
    const gap = 4;

    bars.forEach((bar, i) => {
      bar.h += (bar.target - bar.h) * 0.15;
      if (Math.abs(bar.h - bar.target) < 0.5) {
        bar.target = Math.random() * 80 + 20;
      }
      const x = centerX - (bars.length / 2) * (barWidth + gap) + i * (barWidth + gap);
      const y = centerY - bar.h / 2;
      ctx.fillStyle = bar.color;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, y, barWidth, bar.h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = bar.color;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x, centerY, barWidth, bar.h);
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// Eventos de voz
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();
initVisualizer();

// Cargar eventos
async function cargarEventos() {
  try {
    const res = await fetch(API + '/api/eventos');
    const eventos = await res.json();
    const cont = document.getElementById('lista-eventos');
    cont.innerHTML = '';
    if (eventos.length === 0) {
      cont.innerHTML = '<div class="empty">Sin eventos programados.</div>';
      return;
    }
    eventos.forEach(e => {
      const fecha = new Date(e.fecha);
      cont.innerHTML += `
        <div class="event-card">
          <h3>${e.titulo}</h3>
          <p>${e.descripcion || 'Sin descripción'}</p>
          <div class="time">📅 ${fecha.toLocaleString('es-ES')}</div>
        </div>`;
    });
  } catch (e) {
    console.error('Error cargando eventos:', e);
  }
}

cargarEventos();
loadSongs();
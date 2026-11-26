const API = '';

// ==================== ESTADO ====================
let songs = [];
let shuffledOrder = [];
let currentIndex = 0;
let audio = new Audio();
let audioCtx = null;
let isPlaying = false;
let synth = window.speechSynthesis;
let voices = [];
let currentUtterance = null;

// ==================== FUNCIONES DE AUDIO ====================
function ensureAudioContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      audioCtx = new AC();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
  }
}

function initAudio() {
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';
  audio.muted = false;
  audio.volume = 1.0;

  audio.oncanplay = () => {
    console.log('Audio puede reproducirse');
  };

  audio.onerror = (e) => {
    console.error('Error de audio:', e);
    const el = document.getElementById('song-lyric');
    if (el) el.textContent = 'Error cargando canción. Pasando a la siguiente...';
    setTimeout(() => nextSong(), 2000);
  };

  audio.onended = () => {
    console.log('Canción terminada, siguiente...');
    const disk = document.getElementById('np-disk');
    if (disk) disk.classList.remove('spinning');
    speak('Siguiente canción en Canal Stream Radio');
    nextSong();
  };

  audio.ontimeupdate = () => {
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = pct + '%';
    const cur = document.getElementById('time-current');
    const dur = document.getElementById('time-duration');
    if (cur) cur.textContent = formatTime(audio.currentTime);
    if (dur) dur.textContent = formatTime(audio.duration);
    updateLyric(audio.currentTime);
  };
}

function playSong(index) {
  if (songs.length === 0) {
    document.getElementById('song-lyric').textContent = 'No hay canciones disponibles';
    return;
  }

  if (index < 0 || index >= shuffledOrder.length) {
    shuffledOrder = [...songs].sort(() => Math.random() - 0.5);
    index = 0;
  }
  currentIndex = index;

  const song = shuffledOrder[currentIndex];
  console.log('Reproduciendo:', song.titulo, song.audio_url);

  // Actualizar UI
  document.getElementById('np-title').textContent = song.titulo || 'Canal Stream Radio';
  document.getElementById('np-artist').textContent = song.artista || 'Locutor en vivo';
  document.getElementById('disk-cover').textContent = (song.titulo || '?').charAt(0).toUpperCase();
  document.getElementById('lyric-text').textContent = (song.titulo || '').toUpperCase();
  document.getElementById('song-lyric').textContent = 'Cargando canción...';

  const disk = document.getElementById('np-disk');
  if (disk) disk.classList.add('spinning');

  // Locutor
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
  const locutorEl = document.getElementById('locutor-text');
  if (locutorEl) locutorEl.textContent = randomMsg;
  setTimeout(() => speak(randomMsg), 1000);

  // Cargar y reproducir audio
  audio.src = song.audio_url;
  audio.muted = false;
  audio.volume = 1.0;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.error('Error al reproducir:', err);
      document.getElementById('song-lyric').textContent = 'Error de reproducción. Intenta hacer clic otra vez.';
    });
  }
}

function nextSong() {
  playSong(currentIndex + 1);
}

function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ==================== LETRAS ====================
let lyrics = [];
let lyricIdx = 0;

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

function updateLyric(currentTime) {
  while (lyricIdx < lyrics.length && lyrics[lyricIdx].t <= currentTime) {
    const el = document.getElementById('song-lyric');
    if (el) {
      el.classList.add('fade');
      setTimeout(() => {
        el.textContent = lyrics[lyricIdx].text;
        el.classList.remove('fade');
      }, 400);
      document.getElementById('lyric-text').textContent = lyrics[lyricIdx].text.toUpperCase();
    }
    lyricIdx++;
  }
}

// ==================== LOCUTOR VIRTUAL ====================
function speak(text) {
  if (!synth) return;
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

// ==================== CARGA DE CANCIONES ====================
async function loadSongs() {
  try {
    const res = await fetch(API + '/api/musica');
    songs = await res.json();
    console.log('Canciones cargadas:', songs.length);
    if (songs.length > 0) {
      shuffledOrder = [...songs].sort(() => Math.random() - 0.5);
      currentIndex = 0;
    }
  } catch (e) {
    console.error('Error cargando canciones:', e);
  }
}

// ==================== BOTÓN DE REPRODUCCIÓN ====================
function startRadio() {
  ensureAudioContext();
  if (songs.length === 0) return;
  playSong(currentIndex);
  isPlaying = true;

  // Ocultar botón
  const btn = document.getElementById('btn-play-overlay');
  if (btn && btn.parentNode) {
    btn.style.opacity = '0';
    setTimeout(() => btn.parentNode.removeChild(btn), 600);
  }
}

function ocultarBotonPlay() {
  const btn = document.getElementById('btn-play-overlay');
  if (btn && btn.parentNode) {
    btn.style.opacity = '0';
    setTimeout(() => btn.parentNode.removeChild(btn), 600);
  }
}

// ==================== VISUALIZADOR ====================
function initVisualizer() {
  const canvas = document.getElementById('visualizer');
  if (!canvas) return;
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

// ==================== EVENTOS ====================
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

// ==================== CONTADOR TEMPORADA (independiente de la radio) ====================
const SEASON_END = new Date();
SEASON_END.setDate(SEASON_END.getDate() + 30);

function updateSeasonCounter() {
  const now = new Date().getTime();
  const diff = SEASON_END.getTime() - now;

  if (diff <= 0) {
    const st = document.getElementById('season-status');
    if (st) st.textContent = '¡La temporada ha terminado!';
    ['counter-days','counter-hours','counter-minutes','counter-seconds'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '00';
    });
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const els = {
    'counter-days': days,
    'counter-hours': hours,
    'counter-minutes': minutes,
    'counter-seconds': seconds
  };
  Object.entries(els).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val).padStart(2, '0');
  });
}

setInterval(updateSeasonCounter, 1000);
updateSeasonCounter();

// ==================== INICIALIZACIÓN ====================
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();
initVisualizer();
initAudio();
loadSongs();
cargarEventos();

document.getElementById('btn-play-overlay').addEventListener('click', () => {
  startRadio();
});
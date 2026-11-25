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

// Letras generadas dinámicamente (placeholder hasta tener las reales)
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
      startRadio();
    }
  } catch (e) {
    console.error('Error cargando canciones:', e);
  }
}

// Mezclar playlist (rotación aleatoria sin repetición hasta terminar todas)
function shufflePlaylist() {
  shuffledOrder = [...songs].sort(() => Math.random() - 0.5);
  currentIndex = 0;
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
    // Termino la rotación, vuelvo a mezclar
    shufflePlaylist();
    index = 0;
  }
  currentIndex = index;
  const song = shuffledOrder[currentIndex];

  // Actualizar UI - SIN mostrar nombre de canción
  document.getElementById('np-title').textContent = 'Canal Stream Radio';
  document.getElementById('np-artist').textContent = 'Emisión en vivo';
  document.getElementById('disk-cover').textContent = song.titulo.charAt(0).toUpperCase();
  document.getElementById('lyric-text').textContent = song.titulo.toUpperCase();
  document.getElementById('song-lyric').textContent = 'Iniciando transmisión...';

  // Marcador del disco girando
  const disk = document.getElementById('np-disk');
  disk.classList.add('spinning');

  // Locutor: anunciar canción (sin decir el nombre)
  speak('Nueva canción en Canal Stream Radio');

  // Mensaje del locutor
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

  // Configurar audio
  audio.src = song.audio_url;
  audio.crossOrigin = 'anonymous';

  // Intentar reproducir
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.warn('Autoplay bloqueado o error de audio:', err);
      document.getElementById('song-lyric').textContent = 'Haz clic para iniciar la transmisión';
      document.body.addEventListener('click', () => {
        audio.play();
        audioStarted = true;
      }, { once: true });
    });
  }

  // Letras dinámicas
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

  // Cuando termina, siguiente aleatoria
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

// Formato de tiempo
function formatTime(sec) {
  if (isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Locutor con Web Speech API
function speak(text) {
  if (currentUtterance) {
    synth.cancel();
  }
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

// Cargar voces
function loadVoices() {
  voices = synth.getVoices();
}

// Visualizador de audio simple (canvas)
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

      // Reflejo abajo
      ctx.fillStyle = bar.color;
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x, centerY, barWidth, bar.h);
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// Eventos
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();
initVisualizer();

// Navegación (solo eventos pestaña por si se añade más adelante)
// Iniciar
loadSongs();
const API = '';

// Estado de la radio
let currentSongIndex = 0;
let songs = [];
let audio = new Audio();
let audioStarted = false;
let synth = window.speechSynthesis;
let voices = [];
let currentUtterance = null;

// Letras simuladas para las canciones (porque no tenemos las reales)
const LYRICS_DB = {
  'el-final-de-todo': [
    { t: 0,  text: 'Este es el final de todo' },
    { t: 5,  text: 'No hay vuelta atrás' },
    { t: 10, text: 'Las luces se apagan' },
    { t: 15, text: 'Y solo queda el silencio' },
    { t: 20, text: 'Canal Stream Radio' }
  ],
  'no-me-encuentres': [
    { t: 0,  text: 'No me busques en el pasado' },
    { t: 5,  text: 'Estoy en otro lugar ahora' },
    { t: 10, text: 'La música sigue sonando' },
    { t: 15, text: 'En Canal Stream Radio' },
    { t: 20, text: 'Sigue escuchando' }
  ]
};

// Cargar canciones
async function loadSongs() {
  const res = await fetch(API + '/api/musica');
  songs = await res.json();
  renderUpcoming();
  if (songs.length > 0 && !audioStarted) {
    startRadio();
  }
}

// Render lista de próximas
function renderUpcoming() {
  const cont = document.getElementById('upcoming-list');
  cont.innerHTML = '';
  songs.forEach((s, i) => {
    const isActive = i === currentSongIndex;
    cont.innerHTML += `
      <div class="upcoming-item ${isActive ? 'active' : ''}">
        <div class="upcoming-number">${i + 1}</div>
        <div class="upcoming-info">
          <h4>${s.titulo}</h4>
          <p>${s.artista}</p>
        </div>
      </div>`;
  });
}

// Iniciar la radio (autoplay)
function startRadio() {
  if (songs.length === 0) return;
  playSong(currentSongIndex);
  audioStarted = true;
}

// Reproducir canción
function playSong(index) {
  if (index < 0 || index >= songs.length) {
    currentSongIndex = 0;
    index = 0;
  }
  currentSongIndex = index;
  const song = songs[currentSongIndex];
  
  // Actualizar UI
  document.getElementById('song-title').textContent = song.titulo;
  document.getElementById('song-artist').textContent = song.artista;
  document.getElementById('lyric-bg').textContent = song.titulo.toUpperCase();
  document.getElementById('song-lyric').textContent = 'Iniciando transmisión...';
  
  // Resaltar en lista
  renderUpcoming();
  
  // Locutor: anunciar canción
  speak(`Ahora suena ${song.titulo} de ${song.artista}, solo en Canal Stream Radio`);
  
  // Recomendación del locutor
  setTimeout(() => {
    const recomendaciones = [
      `Esta canción es perfecta para este momento del día`,
      `Te va a gustar esta, es uno de nuestros favoritos`,
      `Sigue sintonizado, viene lo mejor`,
      `Canal Stream Radio, siempre contigo`,
      `Disfruta de esta transmisión`
    ];
    const rec = recomendaciones[Math.floor(Math.random() * recomendaciones.length)];
    document.getElementById('locutor-text').textContent = rec;
    speak(rec);
  }, 3000);
  
  // Segunda recomendación
  setTimeout(() => {
    const rec2 = `Próximamente: más música de ${song.artista} y otros artistas increíbles`;
    document.getElementById('rec-text-2').textContent = rec2;
    speak(rec2);
  }, 8000);
  
  // Configurar audio
  audio.src = song.audio_url;
  audio.crossOrigin = 'anonymous';
  
  // Intentar reproducir
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.error('Autoplay bloqueado por el navegador:', err);
      document.getElementById('song-lyric').textContent = 'Haz clic en cualquier lugar para iniciar la transmisión';
      document.body.addEventListener('click', () => {
        audio.play();
        audioStarted = true;
      }, { once: true });
    });
  }
  
  // Letras simuladas
  const songKey = song.titulo.toLowerCase().replace(/\s+/g, '-');
  const lyrics = LYRICS_DB[songKey] || [
    { t: 0, text: song.titulo },
    { t: 10, text: song.artista },
    { t: 20, text: 'Canal Stream Radio' }
  ];
  
  let lyricIdx = 0;
  const updateLyric = () => {
    const ct = audio.currentTime;
    while (lyricIdx < lyrics.length && lyrics[lyricIdx].t <= ct) {
      document.getElementById('song-lyric').textContent = lyrics[lyricIdx].text;
      document.getElementById('lyric-bg').textContent = lyrics[lyricIdx].text.toUpperCase();
      lyricIdx++;
    }
  };
  
  audio.ontimeupdate = updateLyric;
  
  // Progreso
  const updateProgress = () => {
    const pct = (audio.currentTime / audio.duration) * 100 || 0;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('time-current').textContent = formatTime(audio.currentTime);
    document.getElementById('time-duration').textContent = formatTime(audio.duration);
  };
  audio.ontimeupdate = () => { updateLyric(); updateProgress(); };
  
  // Cuando termina, pasar a la siguiente automáticamente
  audio.onended = () => {
    speak(`Siguiente canción en Canal Stream Radio`);
    playSong(currentSongIndex + 1);
  };
  
  audio.onerror = (e) => {
    console.error('Error de audio:', e);
    document.getElementById('song-lyric').textContent = 'Error cargando canción. Pasando a la siguiente...';
    setTimeout(() => playSong(currentSongIndex + 1), 3000);
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
  currentUtterance.volume = 0.8;
  
  // Buscar voz en español
  if (voices.length > 0) {
    const esVoice = voices.find(v => v.lang.startsWith('es'));
    if (esVoice) currentUtterance.voice = esVoice;
  }
  
  synth.speak(currentUtterance);
}

// Cargar voces del navegador
function loadVoices() {
  voices = synth.getVoices();
}

// Eventos
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Navegación entre pestañas
document.querySelectorAll('.sidebar-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.netflix-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'eventos') cargarEventos();
  });
});

// Cargar eventos
async function cargarEventos() {
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
      <div class="event-card-netflix">
        <h3>${e.titulo}</h3>
        <p>${e.descripcion || 'Sin descripción'}</p>
        <div class="time">📅 ${fecha.toLocaleString('es-ES')}</div>
      </div>`;
  });
}

// Iniciar
loadSongs();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Archivos de datos JSON
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const leer = (archivo) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, archivo), 'utf8'));
  } catch { return []; };
};
const escribir = (archivo, datos) => {
  fs.writeFileSync(path.join(DATA_DIR, archivo), JSON.stringify(datos, null, 2));
};

// Inicializar archivos vacíos si no existen
['dibujos.json', 'episodios.json', 'musica.json', 'eventos.json'].forEach(f => {
  if (!fs.existsSync(path.join(DATA_DIR, f))) escribir(f, []);
});

// ========== DIBUJOS ==========
app.get('/api/dibujos', (req, res) => {
  res.json(leer('dibujos.json'));
});

app.get('/api/dibujos/:id/episodios', (req, res) => {
  const eps = leer('episodios.json').filter(e => e.dibujo_id === parseInt(req.params.id));
  eps.sort((a, b) => (a.numero || 0) - (b.numero || 0));
  res.json(eps);
});

app.post('/api/dibujos', (req, res) => {
  const { titulo, descripcion, portada } = req.body;
  if (!titulo) return res.status(400).json({ error: 'Título requerido' });
  const dibujos = leer('dibujos.json');
  const id = Date.now();
  const nuevo = { id, titulo, descripcion: descripcion || '', portada: portada || '', creado_en: new Date().toISOString() };
  dibujos.push(nuevo);
  escribir('dibujos.json', dibujos);
  res.json(nuevo);
});

app.delete('/api/dibujos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let dibujos = leer('dibujos.json').filter(d => d.id !== id);
  escribir('dibujos.json', dibujos);
  let episodios = leer('episodios.json').filter(e => e.dibujo_id !== id);
  escribir('episodios.json', episodios);
  res.json({ ok: true });
});

app.post('/api/episodios', (req, res) => {
  const { dibujo_id, titulo, numero, video_url, duracion } = req.body;
  if (!dibujo_id || !titulo || !video_url) return res.status(400).json({ error: 'Faltan campos' });
  const episodios = leer('episodios.json');
  const id = Date.now();
  const nuevo = { id, dibujo_id: parseInt(dibujo_id), titulo, numero: parseInt(numero) || 0, video_url, duracion: duracion || '', creado_en: new Date().toISOString() };
  episodios.push(nuevo);
  escribir('episodios.json', episodios);
  res.json(nuevo);
});

app.delete('/api/episodios/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let episodios = leer('episodios.json').filter(e => e.id !== id);
  escribir('episodios.json', episodios);
  res.json({ ok: true });
});

// ========== MÚSICA ==========
app.get('/api/musica', (req, res) => {
  res.json(leer('musica.json'));
});

app.post('/api/musica', (req, res) => {
  const { titulo, artista, album, audio_url, portada } = req.body;
  if (!titulo || !audio_url) return res.status(400).json({ error: 'Título y audio_url requeridos' });
  const musica = leer('musica.json');
  const id = Date.now();
  const nuevo = { id, titulo, artista: artista || '', album: album || '', audio_url, portada: portada || '', creado_en: new Date().toISOString() };
  musica.push(nuevo);
  escribir('musica.json', musica);
  res.json(nuevo);
});

app.delete('/api/musica/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let musica = leer('musica.json').filter(m => m.id !== id);
  escribir('musica.json', musica);
  res.json({ ok: true });
});

// ========== EVENTOS ==========
app.get('/api/eventos', (req, res) => {
  res.json(leer('eventos.json'));
});

app.post('/api/eventos', (req, res) => {
  const { titulo, descripcion, fecha, imagen } = req.body;
  if (!titulo || !fecha) return res.status(400).json({ error: 'Título y fecha requeridos' });
  const eventos = leer('eventos.json');
  const id = Date.now();
  const nuevo = { id, titulo, descripcion: descripcion || '', fecha, imagen: imagen || '', creado_en: new Date().toISOString() };
  eventos.push(nuevo);
  escribir('eventos.json', eventos);
  res.json(nuevo);
});

app.delete('/api/eventos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let eventos = leer('eventos.json').filter(e => e.id !== id);
  escribir('eventos.json', eventos);
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'canal-app' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Canal App escuchando en http://0.0.0.0:${PORT}`);
});
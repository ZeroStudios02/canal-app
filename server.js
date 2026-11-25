const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Base de datos SQLite
const db = new Database(path.join(__dirname, 'canal.db'));

// Crear tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS dibujos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    portada TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS episodios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dibujo_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    numero INTEGER,
    video_url TEXT NOT NULL,
    duracion TEXT,
    creado_en TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (dibujo_id) REFERENCES dibujos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS musica (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    artista TEXT,
    album TEXT,
    audio_url TEXT NOT NULL,
    portada TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha TEXT NOT NULL,
    imagen TEXT,
    creado_en TEXT DEFAULT (datetime('now'))
  );
`);

// Datos de ejemplo (solo si las tablas están vacías)
const contar = (tabla) => db.prepare(`SELECT COUNT(*) as c FROM ${tabla}`).get().c;

if (contar('dibujos') === 0) {
  const insDibujo = db.prepare('INSERT INTO dibujos (titulo, descripcion, portada) VALUES (?, ?, ?)');
  const insEpisodio = db.prepare('INSERT INTO episodios (dibujo_id, titulo, numero, video_url, duracion) VALUES (?, ?, ?, ?, ?)');

  const d1 = insDibujo.run('Aventuras en el Bosque', 'Una serie sobre animales que viven en un bosque mágico.', '/img/placeholder-dibujo.jpg');
  insEpisodio.run(d1.lastInsertRowid, 'El tesoro escondido', 1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '10:30');
  insEpisodio.run(d1.lastInsertRowid, 'La gran carrera', 2, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '11:15');

  const d2 = insDibujo.run('El Robot Amigo', 'Un robot que aprende a ser humano.', '/img/placeholder-dibujo.jpg');
  insEpisodio.run(d2.lastInsertRowid, 'Primer día de escuela', 1, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '12:00');
}

// ========== RUTAS: DIBUJOS ==========
app.get('/api/dibujos', (req, res) => {
  const dibujos = db.prepare('SELECT * FROM dibujos ORDER BY creado_en DESC').all();
  res.json(dibujos);
});

app.get('/api/dibujos/:id/episodios', (req, res) => {
  const episodios = db.prepare('SELECT * FROM episodios WHERE dibujo_id = ? ORDER BY numero').all(req.params.id);
  res.json(episodios);
});

app.post('/api/dibujos', (req, res) => {
  const { titulo, descripcion, portada } = req.body;
  if (!titulo) return res.status(400).json({ error: 'Título requerido' });
  const info = db.prepare('INSERT INTO dibujos (titulo, descripcion, portada) VALUES (?, ?, ?)').run(titulo, descripcion || '', portada || '');
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/dibujos/:id', (req, res) => {
  db.prepare('DELETE FROM dibujos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ========== RUTAS: MÚSICA ==========
app.get('/api/musica', (req, res) => {
  const canciones = db.prepare('SELECT * FROM musica ORDER BY creado_en DESC').all();
  res.json(canciones);
});

app.post('/api/musica', (req, res) => {
  const { titulo, artista, album, audio_url, portada } = req.body;
  if (!titulo || !audio_url) return res.status(400).json({ error: 'Título y audio_url requeridos' });
  const info = db.prepare('INSERT INTO musica (titulo, artista, album, audio_url, portada) VALUES (?, ?, ?, ?, ?)').run(titulo, artista || '', album || '', audio_url, portada || '');
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/musica/:id', (req, res) => {
  db.prepare('DELETE FROM musica WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ========== RUTAS: EVENTOS ==========
app.get('/api/eventos', (req, res) => {
  const eventos = db.prepare('SELECT * FROM eventos ORDER BY fecha ASC').all();
  res.json(eventos);
});

app.post('/api/eventos', (req, res) => {
  const { titulo, descripcion, fecha, imagen } = req.body;
  if (!titulo || !fecha) return res.status(400).json({ error: 'Título y fecha requeridos' });
  const info = db.prepare('INSERT INTO eventos (titulo, descripcion, fecha, imagen) VALUES (?, ?, ?, ?)').run(titulo, descripcion || '', fecha, imagen || '');
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/eventos/:id', (req, res) => {
  db.prepare('DELETE FROM eventos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'canal-app' });
});

// Ruta fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Canal App escuchando en http://0.0.0.0:${PORT}`);
});
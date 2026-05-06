const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ===== GOOGLE AUTH =====
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const SHEET = process.env.SHEET_ID;

// ===== SISTEMA DE PUNTOS =====
// +3 resultado exacto | +1 ganador correcto / empate correcto | 0 fallo
function calcularPuntos(predL, predV, realL, realV) {
  predL=parseInt(predL); predV=parseInt(predV);
  realL=parseInt(realL); realV=parseInt(realV);
  if(isNaN(predL)||isNaN(predV)||isNaN(realL)||isNaN(realV)) return { puntos:0, tipo:'sin-resultado' };
  if(predL===realL && predV===realV) return { puntos:3, tipo:'exact' };
  const ganadorPred = predL>predV?'L': predL<predV?'V':'E';
  const ganadorReal = realL>realV?'L': realL<realV?'V':'E';
  if(ganadorPred===ganadorReal) return { puntos:1, tipo:'win' };
  return { puntos:0, tipo:'miss' };
}

// ===== HELPER: leer hoja =====
async function getRange(range) {
  const r = await sheets.spreadsheets.values.get({ spreadsheetId:SHEET, range });
  return r.data.values || [];
}

// ===== 1. LOGIN =====
app.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    const rows = await getRange('Usuarios!A:D');
    const user = rows.find(r => r[0]&&r[0].toLowerCase()===email.toLowerCase());
    if(user) res.json({ exists:true, nombre:user[1], rol:user[2], avatar:user[3]||'' });
    else res.status(403).json({ exists:false, message:'Usuario no autorizado' });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ===== 2. MATCHES + PREDICCIONES DEL USUARIO =====
app.get('/matches-with-predictions', async (req, res) => {
  try {
    const { email } = req.query;
    const [matchRows, predRows] = await Promise.all([
      getRange('Partidos!A2:J200'),
      getRange('Predicciones!A:F')
    ]);

    // Mapa de predicciones del usuario
    const predMap = {};
    predRows.forEach(r => {
      if(r[1]&&r[1].toLowerCase()===email.toLowerCase()) {
        predMap[r[2]] = { h: r[3]!==undefined?r[3]:'', v: r[4]!==undefined?r[4]:'' };
      }
    });

    const matches = matchRows
      .filter(r => r[0])
      .map(r => ({
        id:        r[0],
        fecha:     r[1] || '',
        fase:      r[2] || 'Grupos',
        grupo:     r[3] || '',
        local:     r[4] || '',
        visitante: r[5] || '',
        flagL:     r[6] || '',
        flagV:     r[7] || '',
        estado:    r[8] || '',   // 'live' | 'done' | ''
        predL:     predMap[r[0]] ? predMap[r[0]].h : '',
        predV:     predMap[r[0]] ? predMap[r[0]].v : '',
      }));

    res.json(matches);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ===== 3. GUARDAR / ACTUALIZAR PREDICCIÓN =====
app.post('/predict', async (req, res) => {
  try {
    const { email, matchId, homeScore, awayScore } = req.body;
    const key = `${email}_${matchId}`;

    const rows = await getRange('Predicciones!A:F');
    const idx  = rows.findIndex(r => r[0]===key);
    const ts   = new Date().toISOString();

    if(idx > -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET,
        range: `Predicciones!D${idx+1}:F${idx+1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[homeScore, awayScore, ts]] }
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET,
        range: 'Predicciones!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[key, email, matchId, homeScore, awayScore, ts]] }
      });
    }
    res.json({ success:true });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ===== 4. RANKING =====
app.get('/ranking', async (req, res) => {
  try {
    const [userRows, predRows, partRows] = await Promise.all([
      getRange('Usuarios!A:B'),
      getRange('Predicciones!A:F'),
      getRange('Partidos!A2:J200'),
    ]);

    // Mapa de resultados reales (columna I y J = goles reales)
    const resultados = {};
    partRows.forEach(r => {
      if(r[0] && r[8]!==undefined && r[9]!==undefined) {
        resultados[r[0]] = { realL: r[8], realV: r[9] };
      }
    });

    // Agrupar predicciones por email
    const userStats = {};
    predRows.forEach(r => {
      if(!r[1]) return;
      const email = r[1].toLowerCase();
      if(!userStats[email]) userStats[email]={ puntos:0, predichos:0, racha:[] };
      userStats[email].predichos++;

      const res = resultados[r[2]];
      if(res && res.realL!=='' && res.realV!=='') {
        const { puntos, tipo } = calcularPuntos(r[3], r[4], res.realL, res.realV);
        userStats[email].puntos += puntos;
        userStats[email].racha.push(tipo);
      }
    });

    // Mapa de nombres
    const nameMap = {};
    userRows.forEach(r => { if(r[0]) nameMap[r[0].toLowerCase()] = r[1]||r[0]; });

    const ranking = Object.entries(userStats).map(([email, s]) => ({
      email,
      nombre:    nameMap[email] || email.split('@')[0],
      puntos:    s.puntos,
      predichos: s.predichos,
      racha:     s.racha.slice(-5),
    })).sort((a,b) => b.puntos - a.puntos);

    res.json(ranking);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ===== 5. ADMIN: CARGAR RESULTADO REAL =====
// Solo lo llama el admin (puedes protegerlo con un token simple)
app.post('/admin/resultado', async (req, res) => {
  try {
    const { adminToken, matchId, golesL, golesV } = req.body;
    if(adminToken !== process.env.ADMIN_TOKEN) return res.status(401).json({ error:'No autorizado' });

    // Buscar el partido y actualizar col I y J (índices 8 y 9)
    const rows = await getRange('Partidos!A2:A200');
    const idx  = rows.findIndex(r => r[0]===matchId);
    if(idx<0) return res.status(404).json({ error:'Partido no encontrado' });

    const rowNum = idx + 2; // +2 porque empieza en A2
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET,
      range: `Partidos!I${rowNum}:J${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[golesL, golesV]] }
    });

    // Marcar como 'done'
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET,
      range: `Partidos!K${rowNum}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['done']] }
    });

    res.json({ success:true, message:`Resultado ${golesL}-${golesV} guardado para partido ${matchId}` });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ===== INICIO =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));

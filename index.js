const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuración de Google Auth
const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SHEET_ID;

// ==========================================
// 1. ENDPOINT: Validar Login de Usuario
// ==========================================
app.post('/login', async (req, res) => {
    try {
        const { email } = req.body;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Usuarios!A:C',
        });
        
        const rows = response.data.values || [];
        // Busca si el correo existe en la columna A
        const user = rows.find(row => row[0] && row[0].toLowerCase() === email.toLowerCase());
        
        if (user) {
            res.json({ exists: true, nombre: user[1], rol: user[2] });
        } else {
            res.status(403).json({ exists: false, message: "Usuario no autorizado" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. ENDPOINT: Obtener Partidos
// ==========================================
app.get('/matches', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Partidos!A2:G50',
        });
        
        const rows = response.data.values || [];
        const matches = rows.map(row => ({
            id: row[0], fecha: row[1], grupo: row[2],
            local: row[3], visitante: row[4],
            flagL: row[5], flagV: row[6]
        }));
        
        res.json(matches);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. ENDPOINT: Guardar o Actualizar Predicción
// ==========================================
app.post('/predict', async (req, res) => {
    try {
        const { email, matchId, homeScore, awayScore } = req.body;
        // Creamos una llave única combinando email y el ID del partido
        const key = `${email}_${matchId}`; 
        
        // Obtenemos las predicciones actuales
        const resp = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Predicciones!A:E',
        });
        
        const rows = resp.data.values || [];
        // Buscamos si ya existe una predicción para ese usuario y ese partido
        const index = rows.findIndex(r => r[0] === key);

        if (index > -1) {
            // Si existe, ACTUALIZAMOS esa fila específica (Google Sheets empieza en fila 1)
            const rowNum = index + 1;
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `Predicciones!D${rowNum}:E${rowNum}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[homeScore, awayScore]] }
            });
        } else {
            // Si no existe, INSERTAMOS una fila nueva
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Predicciones!A:E',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[key, email, matchId, homeScore, awayScore]] }
            });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. ENDPOINT: Obtener Ranking
// ==========================================
app.get('/ranking', async (req, res) => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Ranking!A2:B50', 
        });
        
        const rows = response.data.values || [];
        // Mapeamos y ordenamos de mayor a menor puntaje
        const ranking = rows.map(row => ({
            email: row[0] || 'Desconocido', 
            puntos: parseInt(row[1]) || 0
        })).sort((a, b) => b.puntos - a.puntos);
        
        res.json(ranking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

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

// Endpoint: Obtener partidos
app.get('/matches', async (req, res) => {
    try {
        const range = 'Partidos!A2:G50'; 
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });
        const matches = response.data.values.map(row => ({
            id: row[0], fecha: row[1], grupo: row[2],
            local: row[3], visitante: row[4],
            flagL: row[5], flagV: row[6]
        }));
        res.json(matches);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Endpoint: Guardar predicción
app.post('/predict', async (req, res) => {
    const { email, matchId, homeScore, awayScore } = req.body;
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Predicciones!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[new Date().toISOString(), email, matchId, homeScore, awayScore]],
            },
        });
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
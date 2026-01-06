const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();

// Middleware
app.use(cors()); // Erlaubt dem Frontend (anderer Port) zuzugreifen
app.use(express.json());

app.use(express.static(path.join(__dirname, '../Frontend')));

// 1. Verbindung zur DB (Ersetzt den String mit eurem lokalen oder Atlas String)
mongoose.connect(process.env.MONGO_URI);

// 2. Das Modell (Schema) definieren
const TariffSchema = new mongoose.Schema({
    name: String,
    provider: String,
    baseFee: Number,
    minutes: { included: Number, price: Number },
    sms: { included: Number, price: Number },
    data: { included: Number, price: Number }
});
const Tariff = mongoose.model('Tariff', TariffSchema);

// 3. API Endpunkte (Routes)

// GET: Alle Tarife holen
app.get('/api/tariffs', async (req, res) => {
    const tariffs = await Tariff.find();
    res.json(tariffs);
});

// POST: Neuen Tarif anlegen
app.post('/api/tariffs', async (req, res) => {
    const newTariff = new Tariff(req.body);
    await newTariff.save();
    res.json(newTariff);
});

// DELETE: Tarif löschen
app.delete('/api/tariffs/:id', async (req, res) => {
    await Tariff.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// Server starten
app.listen(3000, () => console.log('Server läuft auf Port 3000'));
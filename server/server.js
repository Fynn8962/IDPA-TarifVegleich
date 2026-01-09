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

mongoose.connect(process.env.MONGO_URI);

//Das Tarif schema
const TariffSchema = new mongoose.Schema({
    name: String,
    provider: String,
    baseFee: Number,
    minutes: { included: Number, price: Number },
    sms: { included: Number, price: Number },
    data: { included: Number, price: Number }
});
const Tariff = mongoose.model('Tariff', TariffSchema);



// GET Tarif
app.get('/api/tariffs', async (req, res) => {
    const tariffs = await Tariff.find();
    res.json(tariffs);
});

// POST Tarif
app.post('/api/tariffs', async (req, res) => {
    const newTariff = new Tariff(req.body);
    await newTariff.save();
    res.json(newTariff);
});

// DELETE Tarif
app.delete('/api/tariffs/:id', async (req, res) => {
    await Tariff.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// PUT Tarif
app.put('/api/tariffs/:id', async (req, res) => {
    // { new: true } gibt den aktualisierten Eintrag zurück
    const updatedTariff = await Tariff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedTariff);
});



// Settings Schema
const SettingsSchema = new mongoose.Schema({
    username: String,
    dataUsage: Number,   // Gewünschte GB
    minutesUsage: Number // Gewünschte Minuten
});

// Erstellt Collection "settings"
const Settings = mongoose.model('Settings', SettingsSchema);

// GET Settings
app.get('/api/settings', async (req, res) => {
    // Suche das erste gefundene Dokument
    const settings = await Settings.findOne();
    // Wenn noch keins existiert, sende leeres Standard-Objekt
    res.json(settings || { username: '', dataUsage: 0, minutesUsage: 0 });
});

// PUT Settings
app.put('/api/settings', async (req, res) => {
    // "upsert: true" bedeutet: Update wenn existiert, sonst erstelle neu
    const updatedSettings = await Settings.findOneAndUpdate(
        {}, // Filter: Finde irgendein Dokument (da wir nur 1 User haben)
        req.body, // Die neuen Daten
        { new: true, upsert: true } // Optionen
    );
    res.json(updatedSettings);
});

// Server starten
app.listen(3000, () => console.log('Server läuft auf Port 3000'));
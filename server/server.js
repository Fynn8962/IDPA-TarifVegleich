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

// PUT: Tarif bearbeiten
app.put('/api/tariffs/:id', async (req, res) => {
    const { id } = req.params;
    // Sucht per ID und überschreibt mit den neuen Daten aus req.body
    await Tariff.findByIdAndUpdate(id, req.body);
    res.json({ message: "Tarif aktualisiert" });
});



// Server starten
app.listen(3000, () => console.log('Server läuft auf Port 3000'));
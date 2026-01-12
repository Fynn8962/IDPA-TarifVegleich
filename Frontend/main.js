// main.js
// Zuständig für: Daten laden, Berechnungen, Formular-Steuerung

const API_URL = "http://localhost:3000/api/tariffs";
const FLAT_LIMIT = 900000; // Ab hier gilt es als unbegrenzt

document.addEventListener("DOMContentLoaded", () => {
    
    // Router: Welcher Teil soll geladen werden
    if (document.getElementById("top3-container")) initComparisonPage();
    if (document.getElementById("add-form")) initAdminPage();
    if (document.getElementById("settings-form")) initSettingsPage();

});

// ==========================================================
// TEIL 1: VERGLEICHS-SEITE (select_tarif.html)
// ==========================================================
function initComparisonPage() {
    const container = document.getElementById("top3-container");
    const storedData = localStorage.getItem("myTarifSettings");

    // Wenn keine User-Daten da sind -> Willkommen anzeigen
    if (!storedData) {
        container.innerHTML = renderWelcomeBox();
        return; 
    }

    // Daten laden und starten
    const userSettings = JSON.parse(storedData);
    
    fetch(API_URL)
        .then(res => res.json())
        .then(tariffs => {
            // 1. Berechnen
            const calculated = calculateAllTariffs(tariffs, userSettings);
            // 2. Sortieren
            calculated.sort((a, b) => a.effectivePrice - b.effectivePrice);
            // 3. Anzeigen
            renderTariffList(container, calculated);
        });
}

// Logik: Berechnet Kosten für alle Tarife
function calculateAllTariffs(tariffs, settings) {
    return tariffs.map(t => {
        let totalCost = t.baseFee;
        let isSuitable = true;

        // Daten Berechnung
        const neededData = settings.dataUsage;
        const isFlatData = t.data.included >= FLAT_LIMIT;
        const incData = isFlatData ? Infinity : (t.data.included || 0);
        
        let diffData = 0;
        let dataCost = 0;

        if (!isFlatData) {
            diffData = Math.max(0, neededData - incData);
            if (diffData > 0) {
                if (t.data.price === null) {
                    isSuitable = false; // Sperre
                } else {
                    dataCost = diffData * t.data.price;
                    totalCost += dataCost;
                }
            }
        }

        // B) Minuten Berechnung
        const neededMin = settings.minutesUsage;
        const isFlatMin = t.minutes.included >= FLAT_LIMIT;
        const incMin = isFlatMin ? Infinity : (t.minutes.included || 0);

        let diffMin = 0;
        let minCost = 0;

        if (!isFlatMin) {
            diffMin = Math.max(0, neededMin - incMin);
            if (diffMin > 0) {
                if (t.minutes.price === null) {
                    isSuitable = false;
                } else {
                    minCost = diffMin * t.minutes.price;
                    totalCost += minCost;
                }
            }
        }

        // Erweitertes Objekt zurückgeben
        return {
            ...t,
            effectivePrice: isSuitable ? totalCost : Infinity,
            isSuitable,
            // Details für die Anzeige speichern
            details: {
                data: { needed: neededData, inc: incData, diff: diffData, cost: dataCost, isFlat: isFlatData },
                min:  { needed: neededMin, inc: incMin, diff: diffMin, cost: minCost, isFlat: isFlatMin }
            }
        };
    });
}

// View: Erzeugt die Liste im HTML
function renderTariffList(container, tariffs) {
    container.innerHTML = "";
    
    if (tariffs.length === 0) {
        container.innerHTML = "<p>Keine Tarife gefunden.</p>";
        return;
    }

    tariffs.forEach((t, index) => {
        const html = createTariffCardHTML(t, index);
        container.innerHTML += html;
    });
}


// ==========================================================
// TEIL 2: ADMIN-SEITE (add_tarif.html)
// ==========================================================
function initAdminPage() {
    const listElement = document.getElementById("tarif-list");
    const form = document.getElementById("add-form");

    // Liste laden
    loadAdminList(listElement);

    // Formular Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validateForm()) return; // Validierung prüfen

        await saveTariff(); // Speichern ausführen
        
        window.resetForm();
        loadAdminList(listElement);
    });

    // Globale Funktionen für Edit/Delete bereitstellen
    window.editTariff = (id) => loadTariffIntoForm(id);
    window.deleteTariff = (id) => executeDelete(id, listElement);
    window.resetForm = () => {
        form.reset();
        document.getElementById("edit-id").value = "";
        document.getElementById("submit-btn").textContent = "Hinzufügen";
        // UI Reset
        if(window.toggleData) window.toggleData();
        if(window.toggleMin) window.toggleMin("");
    };
}

// Logik: Liste vom Server holen
async function loadAdminList(listElement) {
    const res = await fetch(API_URL);
    const tariffs = await res.json();
    window.currentTariffs = tariffs; // Zwischenspeichern für Edit

    listElement.innerHTML = "";
    tariffs.forEach(t => {
        listElement.innerHTML += `
            <li class="list-item">
                <span>${t.name} (${t.baseFee.toFixed(2)} CHF)</span>
                <div>
                    <span style="cursor:pointer; margin-right:10px;" onclick="editTariff('${t._id}')">✎</span>
                    <span class="close-x" onclick="deleteTariff('${t._id}')">&times;</span>
                </div>
            </li>`;
    });
}

// Logik: Tarif speichern (POST/PUT)
async function saveTariff() {
    const editId = document.getElementById("edit-id").value;
    const method = editId ? "PUT" : "POST";
    const url = editId ? `${API_URL}/${editId}` : API_URL;

    // Helper zum Auslesen
    const getVal = (id) => document.getElementById(id).value === "" ? 0 : Number(document.getElementById(id).value);
    
    const isDataFlat = document.getElementById("cb-data-flat").checked;
    const isMinFlat = document.getElementById("cb-min-flat").checked;
    const isMinOff = document.getElementById("cb-min-off").checked;

    // Daten Objekt bauen
    const tariffData = {
        name: document.getElementById("t-name").value,
        provider: document.getElementById("t-provider").value,
        baseFee: Number(document.getElementById("t-baseFee").value),
        data: { 
            included: isDataFlat ? 999999 : getVal("t-data-inc"), 
            price: isDataFlat ? 0 : getVal("t-data-price") 
        },
        minutes: { 
            included: isMinFlat ? 999999 : (isMinOff ? 0 : getVal("t-min-inc")), 
            price: isMinFlat ? 0 : (isMinOff ? null : getVal("t-min-price")) 
        }
    };

    await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tariffData),
    });
}

// Logik: Formular validieren (Keine leeren Felder)
function validateForm() {
    const isValid = (id) => !document.getElementById(id).disabled && document.getElementById(id).value.trim() !== "";
    
    if (!isValid("t-name") || !isValid("t-baseFee")) {
        Modal.alert("Bitte Name und Grundgebühr ausfüllen!");
        return false;
    }
    
    // Prüfen ob Datenfeld aktiv ist aber leer
    const isDataFlat = document.getElementById("cb-data-flat").checked;
    if (!isDataFlat && (!isValid("t-data-inc") || !isValid("t-data-price"))) {
        Modal.alert("Bitte Datenfelder ausfüllen oder Flatrate wählen.");
        return false;
    }

    const isMinFlat = document.getElementById("cb-min-flat").checked;
    const isMinOff = document.getElementById("cb-min-off").checked;
    if (!isMinFlat && !isMinOff && (!isValid("t-min-inc") || !isValid("t-min-price"))) {
        Modal.alert("Bitte Minutenfelder ausfüllen.");
        return false;
    }

    return true;
}

// Logik: Tarif in Formular laden (Edit)
function loadTariffIntoForm(id) {
    const tariff = window.currentTariffs.find(t => t._id === id);
    if (!tariff) return;

    document.getElementById("edit-id").value = tariff._id;
    document.getElementById("t-name").value = tariff.name;
    document.getElementById("t-provider").value = tariff.provider || "";
    document.getElementById("t-baseFee").value = tariff.baseFee;

    // Checkboxen setzen
    const isDataFlat = tariff.data.included >= FLAT_LIMIT;
    document.getElementById("cb-data-flat").checked = isDataFlat;

    const isMinFlat = tariff.minutes.included >= FLAT_LIMIT;
    const isMinOff = tariff.minutes.price === null && tariff.minutes.included === 0;
    
    document.getElementById("cb-min-flat").checked = isMinFlat;
    document.getElementById("cb-min-off").checked = isMinOff;

    // Werte setzen (nur wenn nicht flat/off)
    if (!isDataFlat) {
        document.getElementById("t-data-inc").value = tariff.data.included;
        document.getElementById("t-data-price").value = tariff.data.price;
    }
    if (!isMinFlat && !isMinOff) {
        document.getElementById("t-min-inc").value = tariff.minutes.included;
        document.getElementById("t-min-price").value = tariff.minutes.price;
    }

    // UI aktualisieren (Grau/Aktiv schalten)
    if(window.toggleData) window.toggleData();
    if(window.toggleMin) window.toggleMin(isMinFlat ? "flat" : isMinOff ? "off" : "");

    document.getElementById("submit-btn").textContent = "Aktualisieren";
}

// Logik: Löschen
function executeDelete(id, listElement) {
    Modal.confirm("Möchtest du diesen Tarif wirklich löschen?", async () => {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        loadAdminList(listElement);
    });
}


// ==========================================================
// TEIL 3: EINSTELLUNGEN (settings_tarif.html)
// ==========================================================
function initSettingsPage() {
    const form = document.getElementById("settings-form");
    
    // Laden
    const storedData = localStorage.getItem("myTarifSettings");
    if (storedData) {
        const data = JSON.parse(storedData);
        document.getElementById("s-username").value = data.username || "";
        document.getElementById("s-data").value = data.dataUsage || 0;
        document.getElementById("s-minutes").value = data.minutesUsage || 0;
    }

    // Speichern
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const settingsData = {
            username: document.getElementById("s-username").value,
            dataUsage: Number(document.getElementById("s-data").value),
            minutesUsage: Number(document.getElementById("s-minutes").value),
        };
        localStorage.setItem("myTarifSettings", JSON.stringify(settingsData));
        Modal.alert("Einstellungen gespeichert!");
        setTimeout(() => { window.location.href = "select_tarif.html"; }, 1000);
    });
}


// ==========================================================
// HELPER: HTML GENERATOREN (View)
// ==========================================================

function renderWelcomeBox() {
    return `
        <div class="welcome-box">
            <h2>Willkommen!</h2>
            <p>Bitte erstelle zuerst ein Profil mit deinem Verbrauch,<br>damit wir die besten Tarife finden.</p>
            <a href="settings_tarif.html" class="btn-cta">Profil erstellen</a>
        </div>
    `;
}

function createTariffCardHTML(t, index) {
    // Farben für Platz 1-3
    let borderColor = "#eee";
    let rankBadge = `<span style="color:#999; font-weight:bold;">#${index + 1}</span>`;
    
    if (index === 0) { borderColor = "#2ecc71"; rankBadge = "🥇"; }
    if (index === 1) { borderColor = "#95a5a6"; rankBadge = "🥈"; }
    if (index === 2) { borderColor = "#cd7f32"; rankBadge = "🥉"; }

    // Preis-Text
    const priceDisplay = t.isSuitable
        ? `${t.effectivePrice.toFixed(2)} CHF <span style="font-size:0.6em">effektiv</span>`
        : "Nicht geeignet";

    const flatLabel = t.details.data.isFlat 
        ? `<span class="badge badge-ok" style="margin-left:10px; font-size:0.6em">FLATRATE</span>` 
        : "";

    // Tabellenzeilen generieren
    const dataRow = createRowHTML("Daten", t.details.data, t.data.price);
    const minRow  = createRowHTML("Minuten", t.details.min, t.minutes.price);

    return `
        <div class="card" style="border: 2px solid ${borderColor}; margin-bottom: 20px;">
            <div class="result-header">
                <div class="result-title" style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.5em;">${rankBadge}</span>
                    <div>
                        <div>${t.name} ${flatLabel}</div>
                        <div style="font-size:0.6em; color:#666; font-weight:normal;">${t.provider}</div>
                    </div>
                </div>
                <div class="result-price" style="color: ${t.isSuitable ? "#333" : "red"}">
                    ${priceDisplay}
                </div>
            </div>
            
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th class="col-icon"></th>
                        <th class="col-need">Dein Bedarf</th>
                        <th class="col-offer">Angebot</th>
                        <th class="col-calc">Kosten</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td></td>
                        <td><strong>Grundgebühr</strong></td>
                        <td>-</td>
                        <td style="text-align:right;"><strong>${t.baseFee.toFixed(2)} CHF</strong></td>
                    </tr>
                    ${dataRow}
                    ${minRow}
                </tbody>
            </table>
        </div>
    `;
}

// Hilfsfunktion: Erzeugt eine Tabellenzeile (Daten oder Minuten)
function createRowHTML(type, info, unitPrice) {
    let statusIcon = "";
    let offerText = "";
    let costHtml = "";

    const displayInc = info.isFlat 
        ? (type === "Daten" ? "Unbegrenzt" : "Flatrate") 
        : `${info.inc} ${type === "Daten" ? "GB" : "Min"} inkl.`;

    if (info.diff <= 0) {
        // Fall: Reicht aus
        statusIcon = `<span class="badge badge-ok">✔</span>`;
        offerText = displayInc;
        costHtml = `<td style="text-align:right; color:green;">Inklusive</td>`;
    } else {
        // Fall: Reicht nicht
        if (unitPrice === null) {
            // Sperre
            statusIcon = `<span class="badge badge-err">✖</span>`;
            offerText = `Nur ${info.inc} (Hard Limit)`;
            costHtml = `<td style="text-align:right; color:red; font-weight:bold;">Nicht möglich</td>`;
        } else {
            // Zukauf
            statusIcon = `<span class="badge badge-warn">⚠️</span>`;
            offerText = `${info.inc} (+${info.diff.toFixed(1)} nötig)`;
            
            // Detailrechnung anzeigen
            const unit = type === "Daten" ? "GB" : "Min";
            costHtml = `
                <td class="col-calc">
                    <div style="font-size:0.8em; color:#666; margin-bottom:2px;">Rate: ${unitPrice.toFixed(2)} CHF / ${unit}</div>
                    <small>${info.diff.toFixed(1)} ${unit} x ${unitPrice.toFixed(2)}</small><br>
                    <span class="cost-highlight">+${info.cost.toFixed(2)} CHF</span>
                </td>`;
        }
    }

    return `
        <tr>
            <td>${statusIcon}</td>
            <td>${info.needed} ${type === "Daten" ? "GB" : "Min"}</td>
            <td>${offerText}</td>
            ${costHtml}
        </tr>
    `;
}
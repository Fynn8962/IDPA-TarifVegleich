// --- Custom Modal System ---
// --- Custom Modal System (Erweitert) ---
const Modal = {
  init() {
    // HTML mit Input-Feld vorbereiten
    const html = `
        <div id="custom-modal" class="modal-overlay">
            <div class="modal-box">
                <p id="modal-text" class="modal-msg"></p>
                <div id="modal-input-container"></div>
                <div id="modal-buttons" class="modal-btns"></div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    this.overlay = document.getElementById("custom-modal");
    this.msg = document.getElementById("modal-text");
    this.btns = document.getElementById("modal-buttons");
    this.inputContainer = document.getElementById("modal-input-container");
  },

  close() {
    if (this.overlay) this.overlay.style.display = "none";
    if (this.inputContainer) this.inputContainer.innerHTML = ""; // Input aufräumen
  },

  // 1. Alert (Info)
  alert(text) {
    if (!this.overlay) this.init();
    this.msg.textContent = text;
    this.inputContainer.innerHTML = ""; // Kein Input
    this.btns.innerHTML = `<button class="btn-modal btn-ok" onclick="Modal.close()">OK</button>`;
    this.overlay.style.display = "flex";
  },

  // 2. Confirm (Ja/Nein)
  confirm(text, onConfirm) {
    if (!this.overlay) this.init();
    this.msg.textContent = text;
    this.inputContainer.innerHTML = ""; // Kein Input

    this.btns.innerHTML = `
            <button id="m-cancel" class="btn-modal btn-cancel">Abbrechen</button>
            <button id="m-confirm" class="btn-modal btn-confirm">Ja, löschen</button>
        `;

    document.getElementById("m-cancel").onclick = () => this.close();
    document.getElementById("m-confirm").onclick = () => {
      onConfirm();
      this.close();
    };
    this.overlay.style.display = "flex";
  },

  // 3. Prompt (Passwort Abfrage) - NEU!
  passwordPrompt(text, onVerify) {
    if (!this.overlay) this.init();
    this.msg.textContent = text;

    // Passwort-Feld einfügen
    this.inputContainer.innerHTML = `<input type="password" id="m-input" class="modal-input" placeholder="Passwort" autofocus>`;

    this.btns.innerHTML = `
            <button id="m-cancel" class="btn-modal btn-cancel">Abbrechen</button>
            <button id="m-login" class="btn-modal btn-ok">Login</button>
        `;

    const input = document.getElementById("m-input");

    // Enter-Taste Unterstützung
    input.onkeydown = (e) => {
      if (e.key === "Enter") document.getElementById("m-login").click();
    };

    document.getElementById("m-cancel").onclick = () => this.close();
    document.getElementById("m-login").onclick = () => {
      const pw = input.value;
      onVerify(pw); // Passwort an die Logik übergeben
      this.close();
    };

    this.overlay.style.display = "flex";
    setTimeout(() => input.focus(), 100); // Fokus setzen
  },
};

// --- Globale Admin-Login Funktion ---
window.checkAdminLogin = () => {
  Modal.passwordPrompt(
    "Admin-Bereich. Bitte Passwort eingeben:",
    (password) => {
      if (password === "admin123") {
        localStorage.setItem("isAdmin", "true");
        window.location.href = "add_tarif.html";
      } else {
        Modal.alert("Falsches Passwort!");
      }
    }
  );
};

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3000/api/tariffs";

  // ============================================================
  // TEIL 1: VERGLEICH (select_tarif.html) -> JETZT MIT TOP 3 SORTIERUNG
  // ============================================================
  const top3Container = document.getElementById("top3-container");

  if (top3Container) {
    // 1. Prüfen: Gibt es schon User-Daten?
    const storedData = localStorage.getItem("myTarifSettings");

    if (!storedData) {
      // FALL A: Keine Daten -> Aufforderung anzeigen
      top3Container.innerHTML = `
            <div class="welcome-box">
                <h2>Willkommen beim Tarif-Vergleich!</h2>
                <p>Damit wir die besten Angebote für dich finden können, <br>
                müssen wir wissen, wie viel Daten und Minuten du benötigst.</p>
                
                <a href="settings_tarif.html" class="btn-cta">Jetzt Profil erstellen</a>
            </div>
        `;
      // Wir brechen hier ab, es werden keine Tarife geladen!
    } else {
      // FALL B: Daten vorhanden -> Normal weiter machen
      let userSettings = JSON.parse(storedData);

      // Jetzt erst Tarife laden
      fetch(API_URL)
        .then((res) => res.json())
        .then((tariffs) => {
          calculateAndRenderTop3(tariffs, userSettings);
        });
    }

    function calculateAndRenderTop3(tariffs, settings) {
      // A) Jeden Tarif berechnen und temporär erweitern
      const calculatedTariffs = tariffs.map((t) => {
        let totalCost = t.baseFee;
        let isSuitable = true;
        let reasons = []; // Begründung für Anforderung 6

        // Daten Berechnung
        const neededData = settings.dataUsage - (t.data.included || 0);
        if (neededData > 0) {
          if (t.data.price === null) {
            isSuitable = false; // Hard Limit
            reasons.push(
              `❌ ${neededData.toFixed(1)} GB fehlen (kein Zukauf möglich)`
            );
          } else {
            const extra = neededData * t.data.price;
            totalCost += extra;
            reasons.push(
              `ℹ️ ${neededData.toFixed(1)} GB Zukauf (+${extra.toFixed(2)}CHF)`
            );
          }
        } else {
          reasons.push(`✅ Daten reichen aus`);
        }

        // Minuten Berechnung
        const neededMin = settings.minutesUsage - (t.minutes.included || 0);
        if (neededMin > 0) {
          if (t.minutes.price === null) {
            isSuitable = false;
            reasons.push(`❌ ${neededMin} Min fehlen (kein Zukauf möglich)`);
          } else {
            const extra = neededMin * t.minutes.price;
            totalCost += extra;
            reasons.push(
              `ℹ️ ${neededMin} Min Zukauf (+${extra.toFixed(2)}CHF)`
            );
          }
        }

        // Rückgabe eines erweiterten Objekts für die Sortierung
        return {
          ...t, // Alle originalen Daten
          effectivePrice: isSuitable ? totalCost : Infinity, // Infinity schiebt ungeeignete nach ganz unten
          isSuitable: isSuitable,
          reasons: reasons,
        };
      });

      // B) SORTIEREN (Anforderung 5)
      // Günstigster Preis zuerst
      calculatedTariffs.sort((a, b) => a.effectivePrice - b.effectivePrice);

      // C) TOP 3 ANZEIGEN (Anforderung 6)
      const top3 = calculatedTariffs.slice(0, 3); // Nimm die ersten 3

      top3Container.innerHTML = ""; // Lade-Text entfernen

      top3.forEach((t, index) => {
        // Farblogik für Platz 1, 2, 3
        const rankColor =
          index === 0 ? "gold" : index === 1 ? "silver" : "#cd7f32";
        const priceDisplay = t.isSuitable
          ? `${t.effectivePrice.toFixed(
              2
            )} CHF <span style="font-size:0.6em">effektiv</span>`
          : "Nicht geeignet";

        // HTML Karte bauen
        // HTML Karte bauen (Update mit CSS Klassen)
        const html = `
                <div class="card" style="border: 2px solid ${
                  index === 0 ? "#2ecc71" : "#eee"
                };">
                    
                    <div class="result-header">
                        <div class="result-title">
                            <span style="color:${rankColor}; margin-right: 8px;">#${
          index + 1
        }</span> 
                            ${t.name}
                        </div>
                        <div class="result-price" style="color: ${
                          t.isSuitable ? "#333" : "red"
                        }">
                            ${priceDisplay}
                        </div>
                    </div>
                    
                    <div style="color:#666; margin-bottom: 10px; font-size: 0.9rem;">
                        Anbieter: ${t.provider}
                    </div>
                    
                    <div class="result-details">
                        <strong>Analyse:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px; color: #555;">
                            ${t.reasons.map((r) => `<li>${r}</li>`).join("")}
                        </ul>
                    </div>
                </div>
            `;
        top3Container.innerHTML += html;
      });

      // Falls gar nichts passt oder da ist
      if (top3.length === 0) {
        top3Container.innerHTML = "<p>Keine Tarife gefunden.</p>";
      }
    }
  }

  // ============================================================
  // TEIL 2: VERWALTUNG (add_tarif.html) -> ADD, EDIT, DELETE
  // ============================================================
  const listElement = document.getElementById("tarif-list");
  const addForm = document.getElementById("add-form");

  if (listElement && addForm) {
    // A) Liste laden
    loadList();

    async function loadList() {
      const res = await fetch(API_URL);
      const tariffs = await res.json();

      // Global speichern für Edit-Funktion
      window.currentTariffs = tariffs;

      listElement.innerHTML = "";
      tariffs.forEach((t) => {
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `
                    <span>${t.name} (${t.baseFee}CHF)</span>
                    <div>
                        <span style="cursor:pointer; margin-right:10px;" onclick="editTariff('${t._id}')">✎</span>
                        <span class="close-x" onclick="deleteTariff('${t._id}')">&times;</span>
                    </div>
                `;
        listElement.appendChild(li);
      });
    }

    // B) Submit Handler (POST & PUT)
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const editId = document.getElementById("edit-id").value;
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API_URL}/${editId}` : API_URL;

      // Hilfsfunktion: Leerer String wird null, sonst Zahl
      const getVal = (id) => {
        const val = document.getElementById(id).value;
        return val === "" ? null : Number(val);
      };

      const tariffData = {
        name: document.getElementById("t-name").value,
        provider: document.getElementById("t-provider").value,
        baseFee: Number(document.getElementById("t-baseFee").value),
        data: {
          included: Number(document.getElementById("t-data-inc").value),
          price: getVal("t-data-price"), // Hier nutzen wir die neue Funktion
        },
        minutes: {
          included: Number(document.getElementById("t-min-inc").value),
          price: getVal("t-min-price"), // Hier auch
        },
      };

      await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tariffData),
      });

      window.resetForm();
      loadList();
    });

    // Formular füllen (Edit Start)
    // Formular füllen (Edit Start)
    window.editTariff = (id) => {
      // 1. Tarif suchen
      const tariff = window.currentTariffs.find((t) => t._id === id);
      if (!tariff) return;

      // 2. IDs befüllen (Achte genau auf die Schreibweise!)
      document.getElementById("edit-id").value = tariff._id;

      document.getElementById("t-name").value = tariff.name;
      document.getElementById("t-provider").value = tariff.provider || ""; // Fallback falls leer
      document.getElementById("t-baseFee").value = tariff.baseFee;

      // DATEN (Hier war vermutlich der Fehler)
      document.getElementById("t-data-inc").value = tariff.data.included;
      // Falls price null ist, machen wir das Feld leer (''), sonst den Wert rein
      document.getElementById("t-data-price").value =
        tariff.data.price === null ? "" : tariff.data.price;

      // MINUTEN
      document.getElementById("t-min-inc").value = tariff.minutes.included;
      document.getElementById("t-min-price").value =
        tariff.minutes.price === null ? "" : tariff.minutes.price;

      // 3. Button ändern
      document.getElementById("submit-btn").textContent = "Aktualisieren";
    };

    // Formular Reset
    window.resetForm = () => {
      addForm.reset();
      document.getElementById("edit-id").value = "";
      document.getElementById("submit-btn").textContent = "Hinzufügen";
    };

    // Löschen
    window.deleteTariff = (id) => {
      // Modal aufrufen und sagen, was passieren soll, WENN "Ja" gedrückt wird
      Modal.confirm("Möchtest du diesen Tarif wirklich löschen?", async () => {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        loadList();
      });
    };
  }

  // ============================================================
  // TEIL 3: EINSTELLUNGEN (settings_tarif.html)
  // ============================================================
  const settingsForm = document.getElementById("settings-form");

  if (settingsForm) {
    // A) Laden: Werte aus LocalStorage holen und in Inputs schreiben
    const storedData = localStorage.getItem("myTarifSettings");
    if (storedData) {
      const data = JSON.parse(storedData);
      document.getElementById("s-username").value = data.username || "";
      document.getElementById("s-data").value = data.dataUsage || 0;
      document.getElementById("s-minutes").value = data.minutesUsage || 0;
    }

    // B) Speichern: In LocalStorage schreiben (statt Fetch)
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const settingsData = {
        username: document.getElementById("s-username").value,
        dataUsage: Number(document.getElementById("s-data").value),
        minutesUsage: Number(document.getElementById("s-minutes").value),
      };

      // Das ist der "Trick": Speichern im Browser
      localStorage.setItem("myTarifSettings", JSON.stringify(settingsData));

      // Feedback
      Modal.alert("Einstellungen im Browser gespeichert!");

      // Optional: Nach OK Weiterleitung
      setTimeout(() => {
        window.location.href = "select_tarif.html";
      }, 1500);
    });
  }
});

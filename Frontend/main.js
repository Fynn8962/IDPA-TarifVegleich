// --- Custom Modal System ---
const Modal = {
  init() {
    // Erzeugt das HTML dynamisch (muss man nicht in HTML schreiben)
    const html = `
        <div id="custom-modal" class="modal-overlay">
            <div class="modal-box">
                <p id="modal-text" class="modal-msg"></p>
                <div id="modal-buttons" class="modal-btns"></div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    this.overlay = document.getElementById("custom-modal");
    this.msg = document.getElementById("modal-text");
    this.btns = document.getElementById("modal-buttons");
  },

  close() {
    this.overlay.style.display = "none";
  },

  // Ersatz für alert()
  alert(text) {
    if (!this.overlay) this.init();
    this.msg.textContent = text;
    this.btns.innerHTML = `<button class="btn-modal btn-ok" onclick="Modal.close()">OK</button>`;
    this.overlay.style.display = "flex";
  },

  // Ersatz für confirm() -> WICHTIG: Funktioniert mit Callback!
  confirm(text, onConfirm) {
    if (!this.overlay) this.init();
    this.msg.textContent = text;

    // Buttons erstellen
    this.btns.innerHTML = `
            <button id="m-cancel" class="btn-modal btn-cancel">Abbrechen</button>
            <button id="m-confirm" class="btn-modal btn-confirm">Löschen</button>
        `;

    // Events anhängen
    document.getElementById("m-cancel").onclick = () => this.close();
    document.getElementById("m-confirm").onclick = () => {
      onConfirm(); // Die Lösch-Funktion ausführen
      this.close();
    };

    this.overlay.style.display = "flex";
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:3000/api/tariffs";
  const SETTINGS_URL = "http://localhost:3000/api/settings";

  // ============================================================
  // TEIL 1: VERGLEICH (select_tarif.html)
  // ============================================================
  if (document.querySelector(".tarif-select")) {
    let loadedTariffs = [];
    let userSettings = { dataUsage: 0, minutesUsage: 0 }; // Standardwerte

    // 1. Settings UND Tarife laden (Parallel)
    Promise.all([
      fetch(API_URL).then((res) => res.json()),
      fetch(SETTINGS_URL).then((res) => res.json()),
    ]).then(([tariffs, settings]) => {
      loadedTariffs = tariffs;
      userSettings = settings; // User-Einstellungen speichern
      initDropdowns(tariffs);
    });

    // 2. Dropdowns füllen (bleibt gleich)
    function initDropdowns(tariffs) {
      document.querySelectorAll(".tarif-select").forEach((select) => {
        select.innerHTML =
          '<option value="" disabled selected>Tarif wählen...</option>';
        tariffs.forEach((t) => {
          select.innerHTML += `<option value="${t._id}">${t.name}</option>`;
        });
        select.addEventListener("change", (e) => updateCard(e.target));
      });
    }

    // 3. Karte aktualisieren MIT BERECHNUNG
    function updateCard(select) {
      const tariff = loadedTariffs.find((t) => t._id === select.value);
      const cardId = select.id.replace("select", "card");
      const card = document.getElementById(cardId);

      if (tariff) {
        let totalCost = tariff.baseFee;
        let isSuitable = true; // Variable: Ist der Tarif überhaupt möglich?
        let warnings = [];

        // --- A. DATEN PRÜFUNG ---
        const neededData = userSettings.dataUsage - (tariff.data.included || 0);
        if (neededData > 0) {
          if (tariff.data.price === null) {
            // User braucht mehr, aber Tarif erlaubt kein Extra -> Ungültig
            isSuitable = false;
            warnings.push(
              `Fehlende Daten: ${neededData} GB (Nicht erweiterbar)`
            );
          } else {
            // User zahlt drauf
            totalCost += neededData * tariff.data.price;
          }
        }

        // --- B. MINUTEN PRÜFUNG ---
        const neededMin =
          userSettings.minutesUsage - (tariff.minutes.included || 0);
        if (neededMin > 0) {
          if (tariff.minutes.price === null) {
            isSuitable = false;
            warnings.push(
              `Fehlende Minuten: ${neededMin} Min (Nicht erweiterbar)`
            );
          } else {
            totalCost += neededMin * tariff.minutes.price;
          }
        }

        // --- C. ANZEIGE ---
        const dataInfo =
          tariff.data.included >= userSettings.dataUsage
            ? `<span style="color:green">✔ ${tariff.data.included} GB reichen</span>`
            : `<span style="color:red">❌ Nur ${
                tariff.data.included
              } GB (Fehlt: ${(
                userSettings.dataUsage - tariff.data.included
              ).toFixed(1)} GB)</span>`;

        const minInfo =
          tariff.minutes.included >= userSettings.minutesUsage
            ? `<span style="color:green">✔ ${tariff.minutes.included} Min. reichen</span>`
            : `<span style="color:red">❌ Nur ${
                tariff.minutes.included
              } Min. (Fehlt: ${
                userSettings.minutesUsage - tariff.minutes.included
              })</span>`;

        if (!isSuitable) {
          // ... (Code für "Nicht geeignet" bleibt gleich) ...
          card.innerHTML = `
        <h3>${tariff.name}</h3>
        <div class="price-box" style="background:#7f8c8d; color:white;">Nicht geeignet ❌</div>
        <ul class="details-list" style="color:#c0392b;">
            ${warnings.map((w) => `<li>${w}</li>`).join("")}
        </ul>
    `;
        } else {
          // ... (Code für "Passt") ...
          const isExtra = totalCost > tariff.baseFee;

          card.innerHTML = `
        <h3>${tariff.name}</h3>
        
        <div class="price-box" style="background:${
          isExtra ? "#e67e22" : "#2ecc71"
        }">
            ${totalCost.toFixed(2)} € <small>(Effektiv)</small>
        </div>

        <div style="font-size: 0.9em; margin: 10px 0; background: #f9f9f9; padding: 8px; border-radius: 4px;">
            <div><strong>Daten:</strong> Du brauchst ${
              userSettings.dataUsage
            } GB</div>
            <div>${dataInfo}</div>
            <hr style="margin: 5px 0; border: 0; border-top: 1px solid #ddd;">
            <div><strong>Minuten:</strong> Du brauchst ${
              userSettings.minutesUsage
            } Min</div>
            <div>${minInfo}</div>
        </div>

        <ul class="details-list">
            <li>Grundgebühr: <strong>${tariff.baseFee.toFixed(
              2
            )} €</strong></li>
            ${
              isExtra
                ? `<li style="color:#d35400"> + Zusatzkosten: ${(
                    totalCost - tariff.baseFee
                  ).toFixed(2)} €</li>`
                : ""
            }
        </ul>`;
        }
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
                    <span>${t.name} (${t.baseFee}€)</span>
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
        sms: { included: 0 },
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
    // Laden
    fetch(SETTINGS_URL)
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("s-username").value = data.username || "";
        document.getElementById("s-data").value = data.dataUsage || 0;
        document.getElementById("s-minutes").value = data.minutesUsage || 0;
      });

    // Speichern
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const settingsData = {
        username: document.getElementById("s-username").value,
        dataUsage: Number(document.getElementById("s-data").value),
        minutesUsage: Number(document.getElementById("s-minutes").value),
      };

      await fetch(SETTINGS_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsData),
      });

      
      window.location.href = "select_tarif.html";
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/tariffs';
    const SETTINGS_URL = 'http://localhost:3000/api/settings';

    // ============================================================
    // TEIL 1: VERGLEICH (select_tarif.html)
    // ============================================================
    if (document.querySelector('.tarif-select')) {
        let loadedTariffs = [];

        // 1. Daten holen
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                loadedTariffs = data;
                initDropdowns(data);
            });

        // 2. Dropdowns füllen
        function initDropdowns(tariffs) {
            document.querySelectorAll('.tarif-select').forEach(select => {
                // Reset Options
                select.innerHTML = '<option value="" disabled selected>Tarif wählen...</option>';
                
                tariffs.forEach(t => {
                    select.innerHTML += `<option value="${t._id}">${t.name}</option>`;
                });
                
                // Event Listener
                select.addEventListener('change', (e) => updateCard(e.target));
            });
        }

        // 3. Karte aktualisieren
        function updateCard(select) {
            const tarif = loadedTariffs.find(t => t._id === select.value);
            const cardId = select.id.replace('select', 'card');
            const card = document.getElementById(cardId);

            if (tarif) {
                card.innerHTML = `
                    <h3>${tarif.name}</h3>
                    <div class="price-box">${tarif.baseFee} €</div>
                    <ul class="details-list">
                         <li><strong>Anbieter:</strong> ${tarif.provider}</li>
                         <li><strong>Daten:</strong> ${tarif.data?.included || 0} GB</li>
                         <li><strong>SMS:</strong> ${tarif.sms?.included || 0}</li> 
                    </ul>`;
            }
        }
    }

    // ============================================================
    // TEIL 2: VERWALTUNG (add_tarif.html) -> ADD, EDIT, DELETE
    // ============================================================
    const listElement = document.getElementById('tarif-list');
    const addForm = document.getElementById('add-form');

    if (listElement && addForm) {
        
        // A) Liste laden
        loadList();

        async function loadList() {
            const res = await fetch(API_URL);
            const tariffs = await res.json();
            
            // Global speichern für Edit-Funktion
            window.currentTariffs = tariffs; 

            listElement.innerHTML = ''; 
            tariffs.forEach(t => {
                const li = document.createElement('li');
                li.className = 'list-item';
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
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const editId = document.getElementById('edit-id').value;
            const method = editId ? 'PUT' : 'POST'; 
            const url = editId ? `${API_URL}/${editId}` : API_URL;

            const tariffData = {
                name: document.getElementById('t-name').value,
                baseFee: Number(document.getElementById('t-data2').value),
                provider: document.getElementById('t-data3').value,
                data: { included: Number(document.getElementById('t-data1').value) },
                sms: { included: 0 }, 
                minutes: { included: 0 }
            };

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tariffData)
            });

            window.resetForm(); 
            loadList();         
        });

        // C) Globale Funktionen (für onclick im HTML)
        
        // Formular füllen (Edit Start)
        window.editTariff = (id) => {
            const tariff = window.currentTariffs.find(t => t._id === id);
            if(!tariff) return;

            document.getElementById('edit-id').value = tariff._id;
            document.getElementById('t-name').value = tariff.name;
            document.getElementById('t-data1').value = tariff.data.included;
            document.getElementById('t-data2').value = tariff.baseFee;
            document.getElementById('t-data3').value = tariff.provider;

            document.getElementById('submit-btn').textContent = "Aktualisieren";
        };

        // Formular Reset
        window.resetForm = () => {
            addForm.reset();
            document.getElementById('edit-id').value = ''; 
            document.getElementById('submit-btn').textContent = "Hinzufügen";
        };

        // Löschen
        window.deleteTariff = async (id) => {
            if(confirm('Wirklich löschen?')) {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                loadList(); 
            }
        };
    }

    // ============================================================
    // TEIL 3: EINSTELLUNGEN (settings_tarif.html)
    // ============================================================
    const settingsForm = document.getElementById('settings-form');
    
    if (settingsForm) {
        // Laden
        fetch(SETTINGS_URL)
            .then(res => res.json())
            .then(data => {
                document.getElementById('s-username').value = data.username || '';
                document.getElementById('s-data').value = data.dataUsage || 0;
                document.getElementById('s-minutes').value = data.minutesUsage || 0;
            });

        // Speichern
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const settingsData = {
                username: document.getElementById('s-username').value,
                dataUsage: Number(document.getElementById('s-data').value),
                minutesUsage: Number(document.getElementById('s-minutes').value)
            };

            await fetch(SETTINGS_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsData)
            });

            alert('Profil gespeichert!');
            window.location.href = 'select_tarif.html'; 
        });
    }
});
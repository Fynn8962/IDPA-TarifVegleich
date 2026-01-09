document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/tariffs';

    // Logik für select_tarif.html 
    if (document.querySelector('.tarif-select')) {
        let loadedTariffs = [];
        
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                loadedTariffs = data;
                initDropdowns(data);
            });

        function initDropdowns(tariffs) {
            document.querySelectorAll('.tarif-select').forEach(select => {
                tariffs.forEach(t => {
                    select.innerHTML += `<option value="${t._id}">${t.name}</option>`;
                });
                select.addEventListener('change', (e) => updateCard(e.target));
            });
        }

        function updateCard(select) {
            const tarif = loadedTariffs.find(t => t._id === select.value);
            const card = document.getElementById(select.id.replace('select', 'card'));
            if (tarif) {
                card.innerHTML = `
                    <h3>${tarif.name}</h3>
                    <div class="price-box">${tarif.baseFee} €</div>
                    <ul class="details-list">
                         <li>Anbieter: ${tarif.provider}</li>
                         <li>Daten: ${tarif.data?.included || 0} GB</li>
                    </ul>`;
            }
        }
    }

    // Logik für add_tarif.html
    const listElement = document.getElementById('tarif-list');
    const addForm = document.getElementById('add-form');

    if (listElement && addForm) {
        
        // Liste beim Start laden
        loadList();

        async function loadList() {
            const res = await fetch(API_URL);
            const tariffs = await res.json();
            
            listElement.innerHTML = ''; // Liste leeren
            tariffs.forEach(t => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    ${t.name} (${t.baseFee}€) 
                    <span class="close-x" onclick="deleteTariff('${t._id}')">&times;</span>
                `;
                listElement.appendChild(li);
            });
        }

        // POST
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newTariff = {
                name: document.getElementById('t-name').value,
                baseFee: Number(document.getElementById('t-data2').value), 
                provider: document.getElementById('t-data3').value || "Unbekannt", // "Extra" Feld
                data: { included: Number(document.getElementById('t-data1').value) }, // GB
                sms: { included: 0 },
                minutes: { included: 0 }
            };

            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTariff)
            });

            addForm.reset(); // Formular leeren
            loadList();      // Liste aktualisieren
        });

        // DELETE
        window.deleteTariff = async (id) => {
            if(confirm('Wirklich löschen?')) {
                await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                loadList(); // Liste aktualisieren
            }
        };
    }




    // Logik für settings_tarif.html
    const settingsForm = document.getElementById('settings-form');
    
    if (settingsForm) {
        const SETTINGS_URL = 'http://localhost:3000/api/settings';

        // Werte beim Laden der Seite holen & in Inputs füllen
        fetch(SETTINGS_URL)
            .then(res => res.json())
            .then(data => {
                // IDs müssen in deinem HTML existieren!
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
                method: 'PUT', // Wir nutzen PUT für Updates
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsData)
            });

            alert('Nutzungsprofil gespeichert!');
            // Optional: Zurück zum Vergleich
            window.location.href = 'select_tarif.html'; 
        });
    }

});
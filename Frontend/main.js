document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api/tariffs';
    let loadedTariffs = []; // Hier speichern wir alle Tarife vom Server

    // 1. Daten vom Backend holen
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            loadedTariffs = data; // Daten global speichern
            initDropdowns();      // Dropdowns befüllen
        })
        .catch(err => console.error('Fehler beim Laden:', err));

    // 2. Dropdowns befüllen
    function initDropdowns() {
        const selects = document.querySelectorAll('.tarif-select');
        
        selects.forEach(select => {
            // Für jeden Tarif eine Option erstellen
            loadedTariffs.forEach(tarif => {
                const option = document.createElement('option');
                option.value = tarif._id; // Die MongoDB ID ist der Wert
                option.textContent = tarif.name;
                select.appendChild(option);
            });

            // Event Listener anhängen: Wenn sich DIESES Select ändert
            select.addEventListener('change', (e) => {
                updateCard(e.target);
            });
        });
    }

    // 3. Karte aktualisieren
    function updateCard(selectElement) {
        // ID Mapping: aus "select-1" wird "card-1"
        const cardId = selectElement.id.replace('select', 'card');
        const card = document.getElementById(cardId);
        
        // Den gewählten Tarif im Array finden
        const selectedId = selectElement.value;
        const tarif = loadedTariffs.find(t => t._id === selectedId);

        if (tarif) {
            // HTML in der Karte rendern
            card.innerHTML = `
                <h3>${tarif.name}</h3>
                <div class="price-box">${tarif.baseFee} CHF</div>
                <ul class="details-list">
                    <li><strong>Anbieter:</strong> ${tarif.provider}</li>
                    <li><strong>Daten:</strong> ${tarif.data.included} MB</li>
                    <li><strong>SMS:</strong> ${tarif.sms.included}</li>
                    <li><strong>Minuten:</strong> ${tarif.minutes.included}</li>
                </ul>
            `;
        }
    }
});
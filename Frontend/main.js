document.addEventListener('DOMContentLoaded', () => {
    
    // Logik für select_tarif.html: Dropdowns ändern Content
    const selects = document.querySelectorAll('.tarif-select');
    selects.forEach(select => {
        select.addEventListener('change', (e) => {
            const cardId = e.target.id.replace('select', 'card');
            const card = document.getElementById(cardId);
            // Simuliert Daten-Abruf
            card.innerHTML = `<p>Lade Daten für ${e.target.options[e.target.selectedIndex].text}...</p>`;
            setTimeout(() => {
                card.innerHTML = `<h3>${e.target.options[e.target.selectedIndex].text}</h3><p>Preis: XX €<br>Daten: XX GB</p>`;
            }, 300);
        });
    });

    // Logik für add_tarif.html: Formular Submit
    const addForm = document.getElementById('add-form');
    if (addForm) {
        addForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('t-name').value;
            if (name) {
                // Füge zur UI Liste hinzu
                const list = document.getElementById('tarif-list');
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `${name} <span class="close-x" onclick="this.parentElement.remove()">&times;</span>`;
                list.appendChild(li);
                
                // Reset Form
                addForm.reset();
                console.log(`Backend Call: POST /api/tarifs { name: ${name} }`);
            }
        });
    }

    // Logik für settings_tarif.html: Speichern
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Backend Call: PUT /api/settings - Daten gespeichert");
            alert("Einstellungen gespeichert (Simulation)");
            window.location.href = 'select_tarif.html';
        });
    }
});
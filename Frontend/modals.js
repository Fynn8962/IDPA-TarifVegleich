// modal.js
// Zuständig für: Overlays, Alerts, Bestätigungen und Passworteingabe

const Modal = {
    // Initialisiert das HTML für das Modal einmalig
    init() {
        const html = `
            <div id="custom-modal" class="modal-overlay">
                <div class="modal-box">
                    <p id="modal-text" class="modal-msg"></p>
                    <div id="modal-input-container"></div>
                    <div id="modal-buttons" class="modal-btns"></div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        
        // Elemente cachen für späteren Zugriff
        this.overlay = document.getElementById("custom-modal");
        this.msg = document.getElementById("modal-text");
        this.btns = document.getElementById("modal-buttons");
        this.inputContainer = document.getElementById("modal-input-container");
    },

    // Schließt das Modal und reinigt Inputs
    close() {
        if (this.overlay) this.overlay.style.display = "none";
        if (this.inputContainer) this.inputContainer.innerHTML = "";
    },

    // Zeigt eine einfache Nachricht an
    alert(text) {
        if (!this.overlay) this.init();
        
        this.msg.textContent = text;
        this.inputContainer.innerHTML = "";
        this.btns.innerHTML = `<button class="btn-modal btn-ok" onclick="Modal.close()">OK</button>`;
        
        this.overlay.style.display = "flex";
    },

    // Fragt Ja/Nein ab und führt Funktion aus
    confirm(text, onConfirm) {
        if (!this.overlay) this.init();
        
        this.msg.textContent = text;
        this.inputContainer.innerHTML = "";
        
        this.btns.innerHTML = `
            <button id="m-cancel" class="btn-modal btn-cancel">Abbrechen</button>
            <button id="m-confirm" class="btn-modal btn-confirm">Ja, löschen</button>
        `;

        // Event Listener setzen
        document.getElementById("m-cancel").onclick = () => this.close();
        document.getElementById("m-confirm").onclick = () => {
            onConfirm();
            this.close();
        };
        
        this.overlay.style.display = "flex";
    },

    // Fragt Passwort ab
    passwordPrompt(text, onVerify) {
        if (!this.overlay) this.init();
        
        this.msg.textContent = text;
        this.inputContainer.innerHTML = `<input type="password" id="m-input" class="modal-input" placeholder="Passwort" autofocus>`;
        
        this.btns.innerHTML = `
            <button id="m-cancel" class="btn-modal btn-cancel">Abbrechen</button>
            <button id="m-login" class="btn-modal btn-ok">Login</button>
        `;

        const input = document.getElementById("m-input");
        
        // Enter-Taste erlauben
        input.onkeydown = (e) => {
            if (e.key === "Enter") document.getElementById("m-login").click();
        };

        document.getElementById("m-cancel").onclick = () => this.close();
        document.getElementById("m-login").onclick = () => {
            const pw = input.value;
            onVerify(pw);
            this.close();
        };
        
        this.overlay.style.display = "flex";
        setTimeout(() => input.focus(), 100); // Fokus setzen nach Render
    }
};
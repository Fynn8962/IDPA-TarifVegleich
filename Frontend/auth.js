// auth.js
// Zuständig für: Login-Prüfung und Seitenschutz

// WICHTIG: Der Name muss "checkAdminLogin" sein, damit das HTML ihn findet
window.checkAdminLogin = function() {
    Modal.passwordPrompt("Admin-Bereich. Passwort:", (password) => {
        if (password === "admin123") {
            localStorage.setItem("isAdmin", "true");
            window.location.href = "add_tarif.html";
        } else {
            Modal.alert("Falsches Passwort!");
        }
    });
}

// Logout Funktion
function adminLogout() {
    localStorage.removeItem('isAdmin');
    window.location.href = "select_tarif.html";
}

// Seitenschutz
function protectAdminPage() {
    if (window.location.pathname.includes("add_tarif.html")) {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            window.location.href = "select_tarif.html";
        }
    }
}

// Sofort beim Laden ausführen
protectAdminPage();
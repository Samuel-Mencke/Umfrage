// Authentifizierung für Admin-Bereich
// Verwaltung der Admin-Anmeldung, Sitzungsüberprüfung und Abmeldung

// Schlüssel für den localStorage-Eintrag, der den Authentifizierungsstatus speichert
const AUTH_KEY = 'admin_authenticated';

/**
 * Überprüft, ob der Benutzer authentifiziert ist
 * Prüft sowohl localStorage als auch Cookies nach einem Authentifizierungs-Token
 * @returns {boolean} true wenn authentifiziert, false sonst
 */
function checkAuth() {
    // Prüft, ob ein Authentifizierungs-Token im localStorage oder Cookie vorhanden ist
    const isAuthenticated = localStorage.getItem(AUTH_KEY) || getCookie('admin_token');
    if (!isAuthenticated) {
        // Wenn nicht authentifiziert, Login-Formular anzeigen
        showLoginForm();
        return false;
    }
    return true;
}

/**
 * Liest ein Cookie anhand seines Namens aus
 * @param {string} name - Name des zu lesenden Cookies
 * @returns {string|null} Cookie-Wert oder null wenn nicht gefunden
 */
function getCookie(name) {
    // Formatiert den Cookie-Namen für die Suche (z.B. "admin_token=")
    const nameEQ = name + '=';
    // Teilt alle Cookies anhand des Semikolons auf
    const ca = document.cookie.split(';');
    // Geht durch alle Cookies
    for (let i = 0; i < ca.length; i++) {
        // Entfernt führende und nachfolgende Leerzeichen
        let c = ca[i].trim();
        // Prüft, ob der Cookie mit dem gesuchten Namen beginnt
        if (c.indexOf(nameEQ) === 0) 
            // Gibt den Wert des Cookies zurück (nach dem "=")
            return c.substring(nameEQ.length);
    }
    // Cookie nicht gefunden
    return null;
}

/**
 * Meldet einen Benutzer mit dem übergebenen Passwort an
 * Sendet eine POST-Anfrage an das Login-Endpoint und behandelt die Antwort
 * @param {string} passwort - Das zu überprüfende Passwort
 * @returns {Promise<boolean>} true bei erfolgreichem Login, false sonst
 */
async function login(passwort) {
    try {
        // Sendet eine POST-Anfrage zum Login-Endpoint mit dem Passwort als JSON
        const response = await fetch('../api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passwort })
        });
        
        // Parst die JSON-Antwort vom Server
        const result = await response.json();
        
        // Prüft, ob der Login erfolgreich war
        if (result.success) {
            // Speichert den Authentifizierungsstatus im localStorage für clientseitige Prüfung
            localStorage.setItem(AUTH_KEY, 'true');
            // Lädt die Seite neu, um den Admin-Bereich anzuzeigen
            window.location.reload();
            return true;
        } else {
            // Zeigt eine Fehlermeldung bei falschem Passwort an
            alert('Falsches Passwort!');
            return false;
        }
    } catch (error) {
        // Behandelt Netzwerk- oder andere Fehler während der Anfrage
        alert('Fehler bei der Anmeldung: ' + error.message);
        return false;
    }
}

/**
 * Meldet den aktuellen Benutzer ab
 * Sendet eine DELETE-Anfrage zum Logout-Endpoint und bereinigt lokale Daten
 */
function logout() {
    // Sendet eine DELETE-Anfrage zum Logout-Endpoint
    fetch('../api/login.php', { method: 'DELETE' })
        // Wird ausgeführt, unabhängig davon ob die Anfrage erfolgreich war oder nicht
        .finally(() => {
            // Entfernt den Authentifizierungsstatus aus localStorage
            localStorage.removeItem(AUTH_KEY);
            // Lädt die Seite neu, um zum öffentlichen Bereich zurückzukehren
            window.location.reload();
        });
}

/**
 * Zeigt das Login-Formular an
 * Überschreibt den gesamten Body mit einem zentralen Login-Dialog
 */
function showLoginForm() {
    // Erstellt ein überlagertes Login-Fenster, das den gesamten Bildschirm abdeckt
    document.body.innerHTML = `
        <div style="
            position: fixed;           /* Fixiert die Position relativ zum Viewport */
            top: 0;                    /* Abstand zum oberen Bildschirmrand */
            left: 0;                   /* Abstand zum linken Bildschirmrand */
            width: 100%;               /* Volle Breite */
            height: 100%;              /* Volle Höhe */
            display: flex;             /* Flexbox-Layout für Zentrierung */
            justify-content: center;   /* Zentriert horizontal */
            align-items: center;       /* Zentriert vertikal */
            background: var(--grau-hell); /* Hintergrundfarbe aus CSS-Variablen */
            font-family: alan-sans, sans-serif; /* Schriftart */
            margin: 0;                 /* Keine äußeren Abstände */
            padding: 0;                /* Keine inneren Abstände */
            box-sizing: border-box;    /* Includes padding and border in element's total width and height */
        ">
            <div class="card" style="max-width: 400px; text-align: center; width: 100%;">
                <!-- Titel des Login-Dialogs -->
                <h2 class="titel_umfrage" style="margin-bottom: 20px;">Admin-Login</h2>
                <!-- Hinweistext unter dem Titel -->
                <p class="sidebar-text" style="margin-bottom: 20px;">Bitte gib dein Passwort ein:</p>
                <!-- Passwort-Eingabefeld -->
                <input 
                    type="password"     /* Eingabefeld für Passwort (eingabe wird versteckt) */
                    id="login-passwort" /* Eindeutige ID für JavaScript-Zugriff */
                    class="feld"        /* CSS-Klasse für Styling */
                    placeholder="Passwort" /* Platzhaltertext */
                    style="margin-bottom: 16px;" /* Abstand zum Button darunter */
                    /* Drücken der Enter-Taste löst den Login-Button-Klick aus */
                    onkeypress="if(event.key === 'Enter') document.getElementById('login-btn').click()"
                >
                <!-- Login-Button -->
                <button 
                    id="login-btn"               /* Eindeutige ID */
                    class="btn-absenden"         /* CSS-Klasse für Styling */
                    style="width: 100%;"         /* Button nimmt volle Breite des Containers ein */
                    /* Klick-Handler: Überprüft ob ein Passwort eingegeben wurde und ruft login() auf */
                    onclick="document.getElementById('login-passwort').value ? login(document.getElementById('login-passwort').value) : alert('Bitte Passwort eingeben')"
                >
                    Anmelden
                </button>
            </div>
        </div>
    `;
}

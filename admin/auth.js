// Authentifizierung für Admin-Bereich

const AUTH_KEY = 'admin_authenticated';

function checkAuth() {
    const isAuthenticated = localStorage.getItem(AUTH_KEY) || getCookie('admin_token');
    if (!isAuthenticated) {
        showLoginForm();
        return false;
    }
    return true;
}

function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
}

async function login(passwort) {
    try {
        const response = await fetch('../api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passwort })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem(AUTH_KEY, 'true');
            window.location.reload();
            return true;
        } else {
            alert('Falsches Passwort!');
            return false;
        }
    } catch (error) {
        alert('Fehler bei der Anmeldung: ' + error.message);
        return false;
    }
}

function logout() {
    fetch('../api/login.php', { method: 'DELETE' })
        .finally(() => {
            localStorage.removeItem(AUTH_KEY);
            window.location.reload();
        });
}

function showLoginForm() {
    document.body.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: var(--grau-hell);
            font-family: alan-sans, sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        ">
            <div class="card" style="max-width: 400px; text-align: center; width: 100%;">
                <h2 class="titel_umfrage" style="margin-bottom: 20px;">Admin-Login</h2>
                <p class="sidebar-text" style="margin-bottom: 20px;">Bitte gib dein Passwort ein:</p>
                <input 
                    type="password" 
                    id="login-passwort" 
                    class="feld" 
                    placeholder="Passwort" 
                    style="margin-bottom: 16px;"
                    onkeypress="if(event.key === 'Enter') document.getElementById('login-btn').click()"
                >
                <button 
                    id="login-btn" 
                    class="btn-absenden" 
                    style="width: 100%;"
                    onclick="document.getElementById('login-passwort').value ? login(document.getElementById('login-passwort').value) : alert('Bitte Passwort eingeben')"
                >
                    Anmelden
                </button>
            </div>
        </div>
    `;
}

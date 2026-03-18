
// =============================================
// UMFRAGE-APPLICATION - JAVASCRIPT LOGIK
// Datei: script.js
// Beschriftung: Enthält alle clientseitigen Logiken für:
// - Umfrage-Erstellung (Admin-Bereich)
// - Umfrage-Ausfüllung (User-Bereich)
// - Umfrage-Auswertung (Admin-Bereich)
// - Kommunikation mit der PHP-Backend-API
// =============================================

// KONSTANTEN & VARIABLEN
// Zentrale Konfigurationen und Zustandsvariablen für die Anwendung

// Alle verfügbaren Fragetypen mit ihren IDs und Anzeigetexten
const fragetypen = [
    { id: 'radio', label: 'Nur eine Antwort' },           // Einfachauswahl
    { id: 'checkbox', label: 'Mehrere Antworten' },       // Mehrfachauswahl
    { id: 'text', label: 'Texteingabe' },                 // Freitextfeld
    { id: 'number', label: 'Zahl' },                      // Numerische Eingabe
    { id: 'date', label: 'Datum' },                       // Datumswähler
    { id: 'email', label: 'E-Mail' },                     // E-Mail-Feld mit Validierung
    { id: 'range', label: 'Bewertung (1-5)' }             // Skala von 1 bis 5
];

// Zähler für die Fragen - startet mit 2 weil das Formular bereits 2 Standardfragen enthält
let fragenCount = 2;


/**
 * Ermittelt den Basis-URL für API-Anfragen abhängig vom aktuellen Pfad
 * @returns {string} Der Basis-Pfad für API-Endpunkte
 */
const getApiBase = () => {
    const path = window.location.pathname;
    if (path.includes('/admin/')) return '../api/';   // Admin-Bereich
    if (path.includes('/public/')) return '../api/';  // Public-Bereich
    return 'api/';                                    // Standardfall (User-Bereich)
};

// Speichert den ermittelten API-Basis-Pfad für alle nachfolgenden Anfragen
const apiBase = getApiBase();

/**
 * Setzt ein Cookie mit angegebenem Namen, Wert und Gültigkeitsdauer
 * @param {string} name - Name des Cookies
 * @param {string} value - Wert des Cookies
 * @param {number} days - Anzahl der Tage bis zum Ablauf (Standard: 1)
 */
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Liest den Wert eines Cookies anhand seines Namens
 * @param {string} name - Name des zu lesenden Cookies
 * @returns {string|null} Der Cookie-Wert oder null wenn das Cookie nicht existiert
 */
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
    }
    return null;
}

/**
 * Erstellt oder holt eine eindeutige Teilnehmer-ID für die aktuelle Umfrage-Teilnahme
 * Speichert die ID in einem Cookie für ein Jahr, um Wiederholungsteilnahmen zu verhindern
 * @returns {string} Die eindeutige Teilnehmer-ID
 */
function getTeilnehmerId() {
    let id = getCookie('teilnehmer_id');
    if (!id) {
        // Generiere eine neue ID basierend auf Timestamp und Zufallszahl
        id = 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setCookie('teilnehmer_id', id, 365); // Cookie für 1 Jahr gültig
        console.log('[Teilnehmer] Neue ID erstellt:', id);
    } else {
        console.log('[Teilnehmer] Bestehende ID:', id);
    }
    return id;
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
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

function getTeilnehmerId() {
    let id = getCookie('teilnehmer_id');
    if (!id) {
        id = 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setCookie('teilnehmer_id', id, 365);
        console.log('[Teilnehmer] Neue ID erstellt:', id);
    } else {
        console.log('[Teilnehmer] Bestehende ID:', id);
    }
    return id;
}

async function speichereAntworten(umfrageId, antworten) {
    const teilnehmerId = getTeilnehmerId();
    console.log('[Speichern] Umfrage:', umfrageId, 'Teilnehmer:', teilnehmerId);
    console.log('[Speichern] Antworten:', antworten);
    
    const response = await fetch(apiBase + 'antworten.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ umfrageId, antworten, teilnehmer_id: teilnehmerId })
    });
    
    if (!response.ok) {
        const error = await response.json();
        console.error('[Speichern] Fehler:', error);
        throw new Error(error.error || 'Speichern fehlgeschlagen');
    }
    
    const result = await response.json();
    console.log('[Speichern] Erfolgreich:', result);
    return result;
}

async function ladeAntwortenPerUmfrageId(umfrageId) {
    const teilnehmerId = getTeilnehmerId();
    const response = await fetch(`${apiBase}antworten.php?umfrage_id=${umfrageId}&teilnehmer_id=${teilnehmerId}`);
    if (!response.ok) {
        console.error('API Fehler:', response.status);
        return [];
    }
    return await response.json();
}

async function pruefeObTeilnahmen(umfrageId) {
    const teilnehmerId = getTeilnehmerId();
    const response = await fetch(`${apiBase}antworten.php?umfrage_id=${umfrageId}&pruefen=1&teilnehmer_id=${teilnehmerId}`);
    if (!response.ok) {
        return { hatTeilgenommen: false, antwortId: null };
    }
    const data = await response.json();
    if (!data || typeof data !== 'object') {
        return { hatTeilgenommen: false, antwortId: null };
    }
    return data;
}

async function loescheAntwort(umfrageId) {
    const teilnehmerId = getTeilnehmerId();
    await fetch(apiBase + 'antworten.php?loeschen=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ umfrageId, teilnehmer_id: teilnehmerId })
    });
}

async function speichereUmfrage(umfrage) {
    const response = await fetch(apiBase + 'umfrage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(umfrage)
    });
    const result = await response.json();
    return result.id;
}

async function ladeUmfragePerId(id) {
    const response = await fetch(`${apiBase}umfrage.php?id=${id}`);
    return await response.json();
}

async function ladeAlleUmfragen() {
    const response = await fetch(`${apiBase}umfrage.php`);
    if (!response.ok) {
        throw new Error('Fehler beim Laden der Umfragen');
    }
    return await response.json();
}

async function loescheUmfrage(id) {
    await fetch(`${apiBase}umfrage.php?id=${id}`, { method: 'DELETE' });
}

async function beendeUmfrage(id) {
    await fetch(apiBase + 'umfrage.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aktion: 'beenden' })
    });
}

async function aktiviereUmfrage(id) {
    await fetch(apiBase + 'umfrage.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aktion: 'aktivieren' })
    });
}



async function ladeAlleAntwortenFuerAuswertung(umfrageId) {
    const response = await fetch(`${apiBase}antworten.php?umfrage_id=${umfrageId}&auswertung=1`);
    return await response.json();
}

async function erzeugeAuswertung(umfrageId) {
    const umfrage = await ladeUmfragePerId(umfrageId);
    const antworten = await ladeAlleAntwortenFuerAuswertung(umfrageId);

    if (!Array.isArray(antworten)) {
        console.error('Antworten sind kein Array:', antworten);
    }

    const uniqueTeilnehmer = new Set(antworten.map(a => a.teilnehmer_id).filter(Boolean));
    const tidSeen = new Set();
    const teilnehmerUnique = antworten.filter(a => {
        if (!a.teilnehmer_id) return false;
        if (tidSeen.has(a.teilnehmer_id)) return false;
        tidSeen.add(a.teilnehmer_id);
        return true;
    });

    const auswertung = {
        titel: umfrage.titel,
        beschreibung: umfrage.beschreibung,
        beendetAm: umfrage.beendetAm,
        gesamtTeilnehmer: uniqueTeilnehmer.size,
        fragen: []
    };

    umfrage.fragen.forEach((frage, frageIndex) => {
        const frageAuswertung = {
            frage: frage.frage,
            typ: frage.typ,
            antworten: {},
            textAntworten: [],
            gesamtAntworten: 0
        };

        const tidSet = new Set();

        antworten.forEach(antwort => {
            const tid = antwort.teilnehmer_id;
            if (!tid || tidSet.has(tid)) return;

            const frageAntwort = antwort.antworten[frageIndex];
            if (frageAntwort === undefined || frageAntwort === null) return;

            tidSet.add(tid);

            if (frage.typ === 'radio' || frage.typ === 'checkbox') {
                if (Array.isArray(frageAntwort)) {
                    frageAntwort.forEach(a => {
                        if (!frageAuswertung.antworten[a]) {
                            frageAuswertung.antworten[a] = 0;
                        }
                        frageAuswertung.antworten[a]++;
                    });
                } else if (frageAntwort) {
                    if (!frageAuswertung.antworten[frageAntwort]) {
                        frageAuswertung.antworten[frageAntwort] = 0;
                    }
                    frageAuswertung.antworten[frageAntwort]++;
                }
            } else if (frage.typ === 'range') {
                const num = parseInt(frageAntwort) || 0;
                if (!frageAuswertung.antworten[num]) {
                    frageAuswertung.antworten[num] = 0;
                }
                frageAuswertung.antworten[num]++;
            } else {
                if (frageAntwort) {
                    frageAuswertung.textAntworten.push(frageAntwort);
                }
            }

            frageAuswertung.gesamtAntworten++;
        });

        auswertung.fragen.push(frageAuswertung);
    });

    return auswertung;
}

// HTML-RENDER FUNKTIONEN (User-Bereich)

// Render eine Umfrage für User zum Ausfüllen
async function rendereUmfrageFuerUser(umfrageId) {
    const umfrage = await ladeUmfragePerId(umfrageId);
    const container = document.querySelector('.umfrage-container');

    if (!umfrage) {
        container.innerHTML = '<p class="sidebar-text">Umfrage nicht gefunden.</p>';
        return;
    }

    let alleAntworten = await ladeAntwortenPerUmfrageId(umfrageId);
    if (!Array.isArray(alleAntworten)) {
        console.error('API Fehler beim Laden der Antworten:', alleAntworten);
        alleAntworten = [];
    }
    const teilnehmerId = getTeilnehmerId();
    const eigeneAntwort = alleAntworten.find(a => a.teilnehmer_id === teilnehmerId);
    let alteAntworten = null;
    let hatBereitsTeilgenommen = false;

    if (eigeneAntwort) {
        hatBereitsTeilgenommen = true;
        let parsedAnswers = eigeneAntwort.antworten;
        if (typeof parsedAnswers === 'string' && parsedAnswers.startsWith('[')) {
            try {
                parsedAnswers = JSON.parse(parsedAnswers);
            } catch (e) {
                console.warn('[Umfrage] Konnte Antworten nicht parsen:', parsedAnswers);
            }
        }
        alteAntworten = parsedAnswers;
    }

    if (hatBereitsTeilgenommen && alteAntworten) {
        let html = `
            <div class="card">
                <h2 class="titel_umfrage">${entferneHtml(umfrage.titel)}</h2>
                <p class="sidebar-text" style="margin-bottom: 20px;">${entferneHtml(umfrage.beschreibung || '')}</p>
                <div style="background: #e9ecef; color: #495057; padding: 16px; border-radius: 8px; border: 1px solid #ced4da; margin: 20px 0;">
                    <p style="margin: 0;">${umfrage.status === 'beendet' ? 'Diese Umfrage wurde beendet.' : ''} Deine Antworten kannst du nur noch ansehen.</p>
                </div>`;

        umfrage.fragen.forEach((frage, index) => {
            const alteAntwort = alteAntworten[index];
            html += `<div class="preview-frage">`;
            html += `<p class="preview-frage-text">${index + 1}. ${entferneHtml(frage.frage)}</p>`;

            if (frage.typ === 'radio' || frage.typ === 'checkbox') {
                if (frage.antworten && frage.antworten.length > 0) {
                    frage.antworten.forEach((antwort) => {
                        let isChecked = '';
                        let labelStyle = 'padding: 8px 12px; border-radius: 6px; margin: 4px 0; display: block; background: #f8f9fa; border: 1px solid #dee2e6;';
                        if (alteAntwort) {
                            if (frage.typ === 'radio' && alteAntwort === antwort) {
                                isChecked = ' checked disabled';
                                labelStyle = 'padding: 8px 12px; border-radius: 6px; margin: 4px 0; display: block; background: #d4edda; border: 2px solid #28a745; font-weight: 600;';
                            } else if (frage.typ === 'checkbox' && Array.isArray(alteAntwort) && alteAntwort.includes(antwort)) {
                                isChecked = ' checked disabled';
                                labelStyle = 'padding: 8px 12px; border-radius: 6px; margin: 4px 0; display: block; background: #d4edda; border: 2px solid #28a745; font-weight: 600;';
                            }
                        }
                        html += `<label class="preview-option" style="${labelStyle}">`;
                        html += `<input type="${frage.typ}" name="frage_${index}" value="${entferneHtml(antwort)}"${isChecked} style="margin-right: 10px;">`;
                        html += `${entferneHtml(antwort)}`;
                        html += `</label>`;
                    });
                }
            }
            else if (frage.typ === 'text' || frage.typ === 'number' || frage.typ === 'date' || frage.typ === 'email') {
                const alterWert = alteAntwort || 'Keine Antwort';
                html += `<input class="feld" type="${frage.typ}" value="${entferneHtml(alterWert)}" readonly style="background: var(--grau-hell);">`;
            }
            else if (frage.typ === 'range') {
                const alterWert = alteAntwort || 3;
                html += `<input class="feld-range" type="range" min="1" max="5" value="${alterWert}" disabled style="opacity: 1;">`;
                html += `<p class="sidebar-text" style="margin-top: 8px;">Bewertung: ${alterWert}/5</p>`;
            }

            html += `</div>`;
        });

        html += `
                <a href="/umfrage/index.php" class="btn-zurueck" style="display: inline-block; text-decoration: none; margin-top: 20px;">Zurück zur Startseite</a>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    if (umfrage.status === 'beendet') {
        let html = `
            <div class="card">
                <h2 class="titel_umfrage">${entferneHtml(umfrage.titel)}</h2>
                <p class="sidebar-text" style="margin-bottom: 20px;">${entferneHtml(umfrage.beschreibung || '')}</p>
                <div style="background: #f8d7da; color: #721c24; padding: 16px; border-radius: 8px; border: 1px solid #f5c6cb; margin: 20px 0;">
                    <p style="margin: 0;">Diese Umfrage wurde beendet und kann nicht mehr ausgefüllt werden.</p>
                </div>
                <a href="/umfrage/index.php" class="btn-zurueck" style="display: inline-block; text-decoration: none;">Zurück zur Startseite</a>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    let html = `<h2 class="titel_umfrage">${entferneHtml(umfrage.titel)}</h2>`;

    if (umfrage.beschreibung) {
        html += `<p class="sidebar-text" style="margin-bottom: 20px;">${entferneHtml(umfrage.beschreibung)}</p>`;
    }

    html += '<form id="umfrage-form" class="card">';

    umfrage.fragen.forEach((frage, index) => {
        html += `<div class="preview-frage">`;
        html += `<p class="preview-frage-text">${index + 1}. ${entferneHtml(frage.frage)}</p>`;

        const alteAntwort = alteAntworten ? alteAntworten[index] : null;

        if (frage.typ === 'radio' || frage.typ === 'checkbox') {
            if (frage.antworten && frage.antworten.length > 0) {
                frage.antworten.forEach((antwort) => {
                    let isChecked = '';
                    if (alteAntwort) {
                        if (frage.typ === 'radio' && alteAntwort === antwort) {
                            isChecked = ' checked';
                        } else if (frage.typ === 'checkbox' && Array.isArray(alteAntwort) && alteAntwort.includes(antwort)) {
                            isChecked = ' checked';
                        }
                    }
                    html += `<label class="preview-option">`;
                    html += `<input type="${frage.typ}" name="frage_${index}" value="${entferneHtml(antwort)}"${isChecked}>`;
                    html += `${entferneHtml(antwort)}`;
                    html += `</label>`;
                });
            }
        }
        else if (frage.typ === 'text' || frage.typ === 'number' || frage.typ === 'date' || frage.typ === 'email') {
            const placeholder = frage.typ === 'text' ? 'Deine Antwort...' :
                frage.typ === 'number' ? 'Zahl...' :
                    frage.typ === 'email' ? 'E-Mail...' : '';
            const alterWert = alteAntwort || '';
            html += `<input class="feld" type="${frage.typ}" name="frage_${index}" placeholder="${placeholder}" value="${entferneHtml(alterWert)}">`;
        }
        else if (frage.typ === 'range') {
            const alterWert = alteAntwort || 3;
            html += `<label class="preview-option" style="flex-direction: column; align-items: flex-start; gap: 5px;">`;
            html += `<input class="feld-range" type="range" min="1" max="5" value="${alterWert}" name="frage_${index}" style="width: 100%;">`;
            html += `</label>`;
        }

        html += `</div>`;
    });

    const buttonText = hatBereitsTeilgenommen ? 'Antwort aktualisieren' : 'Absenden';
    html += `
        <div class="button-zeile" style="margin-top: 20px;">
            <button type="submit" class="btn-absenden">${buttonText}</button>
        </div>
    </form>
    `;

    container.innerHTML = html;

    const form = document.getElementById('umfrage-form');
    
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const formData = new FormData(form);
            const unfilledFields = [];
            umfrage.fragen.forEach((frage, index) => {
                if (frage.typ === 'radio') {
                    const checked = form.querySelector(`input[name="frage_${index}"]:checked`);
                    if (!checked) unfilledFields.push(index + 1);
                } else if (frage.typ === 'checkbox') {
                    const checked = form.querySelectorAll(`input[name="frage_${index}"]:checked`);
                    if (checked.length === 0) unfilledFields.push(index + 1);
                } else {
                    const value = formData.get(`frage_${index}`);
                    if (!value || !value.trim()) unfilledFields.push(index + 1);
                }
            });
            if (unfilledFields.length > 0) {
                alert('Bitte fülle alle Fragen aus! Unbeantwortet: ' + unfilledFields.join(', '));
            }
        }
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            if (hatBereitsTeilgenommen) {
                console.log('[Form] Vorhandene Antwort löschen...');
                await loescheAntwort(umfrageId);
            }

            const antworten = {};
            const formData = new FormData(form);

            umfrage.fragen.forEach((frage, index) => {
                if (frage.typ === 'radio') {
                    antworten[index] = formData.get(`frage_${index}`);
                } else if (frage.typ === 'checkbox') {
                    antworten[index] = formData.getAll(`frage_${index}`);
                } else {
                    antworten[index] = formData.get(`frage_${index}`);
                }
            });

            const result = await speichereAntworten(umfrageId, antworten);
            if (result && result.success) {
                window.location.href = '/umfrage/public/danke.html';
            } else {
                throw new Error(result?.error || 'Unbekannter Fehler beim Speichern');
            }
        } catch (e) {
            console.error('[Form] Speicherfehler:', e);
            alert('Fehler beim Speichern: ' + e.message);
        }
    });
}

// Render Danke-Seite nach Absenden
function rendereDankeSeite() {
    const container = document.querySelector('.danke-container');
    container.innerHTML = `
        <div class="card" style="text-align: center; max-width: 400px;">
            <h2 class="titel_umfrage">Danke!</h2>
            <p class="sidebar-text" style="margin-bottom: 20px;">Deine Antworten wurden gespeichert.</p>
            <a href="/umfrage/index.php" class="btn-zurueck" style="display: inline-block; text-decoration: none;">Zurück zur Startseite</a>
        </div>
    `;
}



// ADMIN-RENDER FUNKTION


async function rendereUmfragenListe() {
    const umfragen = await ladeAlleUmfragen();
    const card = document.querySelector('.card');

    if (!card) return;

    // Keine Umfragen vorhanden?
    if (umfragen.length === 0) {
        card.innerHTML = `
            <h2 class="titel_umfrage">Aktuelle Umfragen</h2>
            <hr>
            <p class="sidebar-text">Noch keine Umfragen erstellt.</p>
            <a href="/umfrage/admin/create.html" class="btn-absenden" style="display: inline-block; text-decoration: none; margin-top: 12px;">Erste Umfrage erstellen</a>
        `;
        return;
    }

    let html = '<h2 class="titel_umfrage">Aktuelle Umfragen</h2><hr>';

    umfragen.forEach((umfrage) => {
        const isBeendet = umfrage.status === 'beendet';
        const statusHtml = isBeendet
            ? '<span style="color: #dc3545; font-size: 12px;">Beendet</span>'
            : '<span style="color: #28a745; font-size: 12px;">Aktiv</span>';

        html += `
            <div style="padding: 20px; border-radius: 12px; border:1.5px solid var(--rand); background: var(--grau-hell); margin-bottom: 16px;">
                <h4 class="sidebar-titel" style="font-size: 16px; margin-bottom: 4px;">${entferneHtml(umfrage.titel)}</h4>
                <p class="sidebar-text" style="margin-bottom: 12px;">${entferneHtml(umfrage.beschreibung || '')}</p>
                <p class="sidebar-text" style="margin-bottom: 12px; font-size: 12px;">${umfrage.fragen.length} Fragen • ${statusHtml}</p>

                <div class="button-zeile" style="margin-bottom: 12px;">
                    <a href="/umfrage/public/survey.html?id=${umfrage.id}" class="btn-zurueck" style="display: inline-block; text-decoration: none;">Teilen</a>
                    <button class="btn-auswertung" data-id="${umfrage.id}" style="padding: 12px 28px; border-radius: 99px; border: 1.5px solid var(--blau); background: var(--weiss); color: var(--blau); font-family: alan-sans, sans-serif; font-size: 15px; cursor: pointer;">Auswertung</button>
                </div>

                <div class="button-zeile">
                    ${isBeendet
                ? `<button class="btn-aktivieren" data-id="${umfrage.id}" style="padding: 12px 28px; border-radius: 99px; border: 1.5px solid #28a745; background: var(--weiss); color: #28a745; font-family: alan-sans, sans-serif; font-size: 15px; cursor: pointer;">Reaktivieren</button>`
                : `<button class="btn-beenden" data-id="${umfrage.id}" style="padding: 12px 28px; border-radius: 99px; border: 1.5px solid #ffc107; background: var(--weiss); color: #ffc107; font-family: alan-sans, sans-serif; font-size: 15px; cursor: pointer;">Beenden</button>`
            }
                    <input class="btn-delete" type="button" value="Löschen" data-id="${umfrage.id}">
                </div>
            </div>
        `;
    });

    card.innerHTML = html;

    const beendenBtns = card.querySelectorAll('.btn-beenden');
    beendenBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (confirm('Möchtest du diese Umfrage wirklich beenden?')) {
                await beendeUmfrage(id);
                rendereUmfragenListe();
            }
        });
    });

    const aktivierenBtns = card.querySelectorAll('.btn-aktivieren');
    aktivierenBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (confirm('Möchtest du diese Umfrage wieder aktivieren?')) {
                await aktiviereUmfrage(id);
                rendereUmfragenListe();
            }
        });
    });

    // Event Listener für Auswertung-Buttons
    const auswertungBtns = card.querySelectorAll('.btn-auswertung');
    auswertungBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'));
            zeigeAuswertung(id);
        });
    });

    const deleteBtns = card.querySelectorAll('.btn-delete');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.getAttribute('data-id'));
            if (confirm('Möchtest du diese Umfrage wirklich löschen? Alle Antworten gehen verloren!')) {
                await loescheUmfrage(id);
                rendereUmfragenListe();
            }
        });
    });
}

async function zeigeAuswertung(umfrageId) {
    const auswertung = await erzeugeAuswertung(umfrageId);
    const card = document.querySelector('.card');

    let html = `
        <div style="margin-bottom: 16px;">
            <button class="btn-zurueck" onclick="rendereUmfragenListe()" style="padding: 8px 16px; font-size: 14px;">← Zurück</button>
        </div>
        <h2 class="titel_umfrage">${entferneHtml(auswertung.titel)}</h2>
        <p class="sidebar-text">${entferneHtml(auswertung.beschreibung || '')}</p>
        <hr>
        <div style="background: var(--blau); color: white; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="font-size: 24px; font-weight: bold; margin: 0;">${auswertung.gesamtTeilnehmer}</p>
            <p style="font-size: 14px; margin: 4px 0 0 0;">Teilnehmer </p>
        </div>
    `;

    auswertung.fragen.forEach((frage, index) => {
        html += `<div style="margin-bottom: 24px;">`;
        html += `<h3 class="titel_umfrage" style="font-size: 15px;">Frage ${index + 1}: ${entferneHtml(frage.frage)}</h3>`;
        html += `<p class="sidebar-text" style="font-size: 12px; margin-bottom: 8px;">${frage.typ} • ${frage.gesamtAntworten} Antworten</p>`;

        if (frage.typ === 'radio' || frage.typ === 'checkbox') {
            const maxCount = Math.max(...Object.values(frage.antworten));
            Object.entries(frage.antworten).forEach(([antwort, count]) => {
                const prozent = ((count / frage.gesamtAntworten) * 100).toFixed(1);
                const barWidth = (count / maxCount) * 100;
                html += `
                    <div style="margin-bottom: 8px;">
                        <p style="font-size: 14px; margin-bottom: 4px;">${entferneHtml(antwort)} (${count} = ${prozent}%)</p>
                        <div style="background: var(--rand); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: var(--blau); height: 100%; width: ${barWidth}%;"></div>
                        </div>
                    </div>
                `;
            });
        } else if (frage.typ === 'range') {
            const maxCount = Math.max(...Object.values(frage.antworten));
            html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
            for (let i = 1; i <= 5; i++) {
                const count = frage.antworten[i] || 0;
                const prozent = ((count / frage.gesamtAntworten) * 100).toFixed(1);
                const barWidth = (count / maxCount) * 100;
                html += `
                    <div>
                        <p style="font-size: 14px; margin-bottom: 4px;">${i} (${count} = ${prozent}%)</p>
                        <div style="background: var(--rand); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: var(--blau); height: 100%; width: ${barWidth}%;"></div>
                        </div>
                    </div>
                `;
            }
            html += `</div>`;
        } else {
            // Text, Number, Date, Email
            html += `<div style="background: var(--grau-hell); padding: 12px; border-radius: 8px; max-height: 200px; overflow-y: auto;">`;
            frage.textAntworten.forEach(antwort => {
                html += `<p style="font-size: 13px; padding: 4px 0; border-bottom: 1px solid var(--rand);">${entferneHtml(antwort)}</p>`;
            });
            html += `</div>`;
        }

        html += `</div>`;
    });

    card.innerHTML = html;
}

async function rendereUmfragenAufStartseite() {
    const container = document.getElementById('startseite-umfragen');
    if (!container) return;

    let umfragen;
    try {
        umfragen = await ladeAlleUmfragen();
    } catch (e) {
        console.error('Fehler beim Laden der Umfragen:', e);
        container.innerHTML = '<p class="sidebar-text">Fehler beim Laden der Umfragen.</p>';
        return;
    }

    if (umfragen.length === 0) {
        container.innerHTML = '<p class="sidebar-text">Noch keine Umfragen erstellt.</p>';
        return;
    }

    let html = '';
    for (const umfrage of umfragen) {
        let hatTeilnahmen = false;
        try {
            const bereitsTeilgenommen = await pruefeObTeilnahmen(umfrage.id);
            hatTeilgenommen = bereitsTeilgenommen && bereitsTeilgenommen.hatTeilgenommen;
        } catch (e) {
            console.error('Fehler beim Prüfen der Teilnahme:', e);
        }
        const isBeendet = umfrage.status === 'beendet';

        let statusClass = 'umfrage-beendet';
        let buttonText = 'Jetzt teilnehmen';

        if (hatTeilgenommen) {
            buttonText = 'Antwort ansehen';
        }

        html += `
            <div class="umfrage-card ${statusClass}" style="padding: 20px; border-radius: 12px; border:1.5px solid var(--rand); background: var(--grau-hell); margin-bottom: 16px;">
                <h4 class="sidebar-titel" style="font-size: 16px; margin-bottom: 4px;">${entferneHtml(umfrage.titel)}</h4>
                <p class="sidebar-text" style="margin-bottom: 12px;">${entferneHtml(umfrage.beschreibung || '')}</p>
                <p class="sidebar-text" style="margin-bottom: 12px; font-size: 12px;">${umfrage.fragen.length} Fragen ${isBeendet ? '• <span style="color: #dc3545;">Beendet</span>' : ''}</p>
                ${hatTeilgenommen ? '<p class="sidebar-text" style="margin-bottom: 12px; font-size: 12px; color: #28a745;">✓ Bereits beantwortet</p>' : ''}
                ${isBeendet ? '<p class="sidebar-text" style="margin-bottom: 12px; font-size: 12px; color: #dc3545;">Umfrage beendet</p>' : ''}
                <a href="/umfrage/public/survey.html?id=${umfrage.id}" class="btn-absenden" style="display: inline-block; text-decoration: none;">${buttonText}</a>
            </div>
        `;
    }

    container.innerHTML = html;
}


// FRAGEN & ANTWORTEN


// Neue Frage hinzufügen
function addFrage() {
    fragenCount++;

    // Container für die neue Frage
    const frageBlock = document.createElement('div');
    frageBlock.className = 'frage-block';
    frageBlock.id = `frage-${fragenCount}`;
    frageBlock.style.padding = '20px';
    frageBlock.style.borderRadius = '12px';
    frageBlock.style.border = '1.5px solid var(--rand)';
    frageBlock.style.background = 'var(--grau-hell)';
    frageBlock.style.marginBottom = '16px';

    // Titel + Delete-Button Container
    const titelContainer = document.createElement('div');
    titelContainer.style.display = 'flex';
    titelContainer.style.justifyContent = 'space-between';
    titelContainer.style.alignItems = 'center';
    titelContainer.style.marginBottom = '12px';

    // Titel
    const titel = document.createElement('h4');
    titel.className = 'sidebar-titel';
    titel.style.fontSize = '16px';
    titel.textContent = `Frage ${fragenCount}`;
    titelContainer.appendChild(titel);

    frageBlock.appendChild(titelContainer);

    // Delete-Button für die ganze Frage
    const deleteFrageBtn = document.createElement('button');
    deleteFrageBtn.className = 'btn-delete-klein';
    deleteFrageBtn.type = 'button';
    deleteFrageBtn.innerHTML = '<img src="../src/icons/delete.svg" style="width: 16px; height: 16px;">';
    deleteFrageBtn.addEventListener('click', () => deleteFrage(frageBlock));
    titelContainer.appendChild(deleteFrageBtn);

    // Label für die Frage
    const frageLabel = document.createElement('label');
    frageLabel.className = 'feld-label';
    frageLabel.textContent = 'Was möchtest du fragen?';
    frageBlock.appendChild(frageLabel);

    // Eingabefeld für die Frage
    const frageInput = document.createElement('input');
    frageInput.className = 'feld';
    frageInput.type = 'text';
    frageInput.placeholder = 'Frage';
    frageBlock.appendChild(frageInput);

    // Label für Antworttyp
    const typLabel = document.createElement('label');
    typLabel.className = 'feld-label';
    typLabel.textContent = 'Antworttyp';
    frageBlock.appendChild(typLabel);

    // Container für Antworttyp-Auswahl (Grid für 2 Spalten bei Desktop)
    const typContainer = document.createElement('div');
    typContainer.style.display = 'grid';
    typContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
    typContainer.style.gap = '10px';
    typContainer.style.marginBottom = '12px';

    // Alle Fragetypen als klickbare Karten erstellen
    fragetypen.forEach((typ, index) => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'option';
        optionLabel.htmlFor = `type${fragenCount}-${typ.id}`;

        const typeInput = document.createElement('input');
        typeInput.type = 'radio';
        typeInput.id = `type${fragenCount}-${typ.id}`;
        typeInput.name = `type${fragenCount}`;
        typeInput.className = `type-${typ.id}`;

        // Erster Typ (radio) ist Standard ausgewählt
        if (index === 0) {
            typeInput.checked = true;
        }

        optionLabel.appendChild(typeInput);
        optionLabel.appendChild(document.createTextNode(` ${typ.label}`));
        typContainer.appendChild(optionLabel);
    });

    frageBlock.appendChild(typContainer);

    // Label für Antwortmöglichkeiten / Vorschau
    const antwortLabel = document.createElement('label');
    antwortLabel.className = 'feld-label';
    antwortLabel.textContent = 'Antwortmöglichkeiten';
    frageBlock.appendChild(antwortLabel);

    // Container für Antworten (radio/checkbox)
    const antwortenListe = document.createElement('div');
    antwortenListe.className = 'antworten-liste';

    // 2 Standard-Antworten hinzufügen
    for (let i = 1; i <= 2; i++) {
        const antwortDiv = document.createElement('div');
        const antwortOptionLabel = document.createElement('label');
        antwortOptionLabel.className = 'option';

        const antwortRadio = document.createElement('input');
        antwortRadio.type = 'radio';
        antwortRadio.name = `opt-${fragenCount}`;
        antwortRadio.disabled = true;

        const antwortText = document.createElement('input');
        antwortText.className = 'feld';
        antwortText.type = 'text';
        antwortText.placeholder = `Antwortmöglichkeit ${i}`;

        const loeschBtn = document.createElement('button');
        loeschBtn.className = 'btn-delete-klein';
        loeschBtn.type = 'button';
        loeschBtn.innerHTML = '<img src="../src/icons/delete.svg" style="width: 16px; height: 16px;">';
        loeschBtn.addEventListener('click', () => deleteElement(antwortDiv, antwortenListe));

        antwortOptionLabel.appendChild(antwortRadio);
        antwortOptionLabel.appendChild(antwortText);
        antwortOptionLabel.appendChild(loeschBtn);
        antwortDiv.appendChild(antwortOptionLabel);
        antwortenListe.appendChild(antwortDiv);
    }

    frageBlock.appendChild(antwortenListe);

    // Button für neue Antwort
    const addAntwortBtn = document.createElement('input');
    addAntwortBtn.className = 'btn-zurueck btn-add-antwort';
    addAntwortBtn.type = 'button';
    addAntwortBtn.value = '+ Antwort hinzufügen';
    addAntwortBtn.style.marginTop = '8px';
    addAntwortBtn.addEventListener('click', () => addAntwort(frageBlock));

    frageBlock.appendChild(addAntwortBtn);

    // Vorschau-Felder für alle anderen Typen (text/number/date/email/range)
    const vorschauContainer = document.createElement('div');
    vorschauContainer.className = 'vorschau-container';
    vorschauContainer.style.display = 'none';

    // Vorschau-Felder-Label
    const vorschauLabel = document.createElement('label');
    vorschauLabel.className = 'feld-label';
    vorschauLabel.textContent = 'Vorschau';
    vorschauContainer.appendChild(vorschauLabel);

    // Text-Vorschau
    const textPreview = document.createElement('input');
    textPreview.className = 'feld vorschau-text';
    textPreview.type = 'text';
    textPreview.placeholder = 'Texteingabe...';
    textPreview.disabled = true;
    textPreview.style.display = 'none';
    vorschauContainer.appendChild(textPreview);

    // Number-Vorschau
    const numberPreview = document.createElement('input');
    numberPreview.className = 'feld vorschau-number';
    numberPreview.type = 'number';
    numberPreview.placeholder = 'Zahl...';
    numberPreview.disabled = true;
    numberPreview.style.display = 'none';
    vorschauContainer.appendChild(numberPreview);

    // Date-Vorschau
    const datePreview = document.createElement('input');
    datePreview.className = 'feld vorschau-date';
    datePreview.type = 'date';
    datePreview.disabled = true;
    datePreview.style.display = 'none';
    vorschauContainer.appendChild(datePreview);

    // Email-Vorschau
    const emailPreview = document.createElement('input');
    emailPreview.className = 'feld vorschau-email';
    emailPreview.type = 'email';
    emailPreview.placeholder = 'E-Mail...';
    emailPreview.disabled = true;
    emailPreview.style.display = 'none';
    vorschauContainer.appendChild(emailPreview);

    // Range-Vorschau (Bewertung 1-5)
    const rangePreview = document.createElement('input');
    rangePreview.className = 'feld-range vorschau-range';
    rangePreview.type = 'range';
    rangePreview.min = '1';
    rangePreview.max = '5';
    rangePreview.value = '3';
    rangePreview.disabled = true;
    rangePreview.style.display = 'none';
    vorschauContainer.appendChild(rangePreview);

    frageBlock.appendChild(vorschauContainer);

    // Event Listener für Typ-Wechsel bei allen 7 Typen
    fragetypen.forEach((typ) => {
        const typeInput = frageBlock.querySelector(`.type-${typ.id}`);
        if (typeInput) {
            typeInput.addEventListener('change', () => {
                wechsleAntworttyp(frageBlock);
                updatePreview();
            });
        }
    });

    // Frage vor dem "+ Neue Frage"-Button einfügen
    const addFrageBtn = document.querySelector('.btn-add-frage');
    addFrageBtn.parentNode.insertBefore(frageBlock, addFrageBtn);

    frageInput.addEventListener('input', updatePreview);
}

// Antwort zu einer Frage hinzufügen (nur bei radio/checkbox)
function addAntwort(frageBlock) {
    const antwortenListe = frageBlock.querySelector('.antworten-liste');

    // Prüfen: Nur bei radio/checkbox Antworten hinzufügen
    const radioType = frageBlock.querySelector('.type-radio');
    const checkboxType = frageBlock.querySelector('.type-checkbox');

    if (!radioType.checked && !checkboxType.checked) {
        return;
    }

    // Welcher Typ ist aktiv? Radio oder Checkbox?
    let antwortTyp = 'radio';
    if (checkboxType && checkboxType.checked) {
        antwortTyp = 'checkbox';
    }

    // Fragenummer holen
    const frageNummer = frageBlock.id.split('-')[1];

    // Antworten in dieser Liste zählen
    const existingAnswers = antwortenListe.children;
    const antwortNummer = existingAnswers.length + 1;

    // Neue Antwort erstellen
    const antwortDiv = document.createElement('div');
    const antwortLabel = document.createElement('label');
    antwortLabel.className = 'option';

    // Radio oder Checkbox erstellen
    const antwortInput = document.createElement('input');
    antwortInput.type = antwortTyp;
    antwortInput.name = `opt-${frageNummer}`;
    antwortInput.disabled = true;

    // Textfeld erstellen
    const textField = document.createElement('input');
    textField.className = 'feld';
    textField.type = 'text';
    textField.placeholder = `Antwortmöglichkeit ${antwortNummer}`;

    // Lösch-Button hinzufügen
    const loeschBtn = document.createElement('button');
    loeschBtn.className = 'btn-delete-klein';
    loeschBtn.type = 'button';
    loeschBtn.innerHTML = '<img src="../src/icons/delete.svg" style="width: 16px; height: 16px;">';
    loeschBtn.addEventListener('click', () => deleteElement(antwortDiv, antwortenListe));

    // Alles zusammenbauen
    antwortLabel.appendChild(antwortInput);
    antwortLabel.appendChild(textField);
    antwortLabel.appendChild(loeschBtn);
    antwortDiv.appendChild(antwortLabel);

    antwortenListe.appendChild(antwortDiv);

    textField.addEventListener('input', updatePreview);
}

// Element löschen - aber nur wenn noch mindestens 2 Antworten übrig sind
function deleteElement(element, antwortenListe) {
    const anzahlAntworten = antwortenListe.children.length;

    if (anzahlAntworten <= 2) {
        alert('Mindestens 2 Antworten sind erforderlich!');
        return;
    }

    element.remove();
}

// Ganze Frage löschen - aber nur wenn noch mindestens 2 Fragen übrig sind
function deleteFrage(frageBlock) {
    const alleFragen = document.querySelectorAll('.frage-block');

    if (alleFragen.length <= 2) {
        alert('Mindestens 2 Fragen sind erforderlich!');
        return;
    }

    frageBlock.remove();
    updatePreview();
}

// Delete-Button zu bestehenden Fragen hinzufügen
function addFrageDeleteButton(frageBlock) {
    const titel = frageBlock.querySelector('h4');

    // Prüfen ob schon ein Container da ist
    let titelContainer = titel.parentNode;
    if (titelContainer.tagName !== 'DIV' || !titelContainer.style.display || titelContainer.style.display !== 'flex') {
        // Neuen Container erstellen
        titelContainer = document.createElement('div');
        titelContainer.style.display = 'flex';
        titelContainer.style.justifyContent = 'space-between';
        titelContainer.style.alignItems = 'center';
        titelContainer.style.marginBottom = '12px';

        // Titel in Container verschieben
        titel.parentNode.insertBefore(titelContainer, titel);
        titelContainer.appendChild(titel);
    }

    // Prüfen ob schon ein Delete-Button da ist
    const existingBtn = titelContainer.querySelector('.btn-delete-klein');
    if (existingBtn) return;

    // Delete-Button erstellen
    const deleteFrageBtn = document.createElement('button');
    deleteFrageBtn.className = 'btn-delete-klein';
    deleteFrageBtn.type = 'button';
    deleteFrageBtn.innerHTML = '<img src="../src/icons/delete.svg" style="width: 16px; height: 16px;">';
    deleteFrageBtn.addEventListener('click', () => deleteFrage(frageBlock));

    titelContainer.appendChild(deleteFrageBtn);
}

// Antworttyp einer Frage ändern - zeigt/versteckt die passenden Elemente
function wechsleAntworttyp(frageBlock) {
    const antwortenListe = frageBlock.querySelector('.antworten-liste');
    const addAntwortBtn = frageBlock.querySelector('.btn-add-antwort');
    const vorschauContainer = frageBlock.querySelector('.vorschau-container');
    const frageNummer = frageBlock.id.split('-')[1];

    // Welcher Typ ist jetzt aktiv?
    let ausgewaehlterTyp = 'radio';
    fragetypen.forEach((typ) => {
        const typeInput = frageBlock.querySelector(`.type-${typ.id}`);
        if (typeInput && typeInput.checked) {
            ausgewaehlterTyp = typ.id;
        }
    });

    // Bei radio/checkbox: Antwortliste zeigen, Vorschau ausblenden
    if (ausgewaehlterTyp === 'radio' || ausgewaehlterTyp === 'checkbox') {
        antwortenListe.style.display = 'block';
        addAntwortBtn.style.display = 'inline-block';
        vorschauContainer.style.display = 'none';

        // Alle Antworten durchgehen und Typ ändern
        const antworten = antwortenListe.querySelectorAll('.option');

        antworten.forEach(antwort => {
            const oldInput = antwort.querySelector('input[type="radio"], input[type="checkbox"]');
            const textField = antwort.querySelector('.feld');

            // Textinhalt merken
            const textValue = textField.value;

            // Alten Input entfernen
            oldInput.remove();

            // Neuen Input erstellen
            const newInput = document.createElement('input');
            newInput.type = ausgewaehlterTyp;
            newInput.name = `opt-${frageNummer}`;
            newInput.disabled = true;

            // Neuen Input am Anfang einfügen
            antwort.insertBefore(newInput, textField);
        });
    } else {
        // Bei text/number/date/email/range: Antwortliste ausblenden, Vorschau zeigen
        antwortenListe.style.display = 'none';
        addAntwortBtn.style.display = 'none';
        vorschauContainer.style.display = 'block';

        // Alle Vorschau-Felder ausblenden
        vorschauContainer.querySelectorAll('.vorschau-text, .vorschau-number, .vorschau-date, .vorschau-email, .vorschau-range').forEach(el => {
            el.style.display = 'none';
        });

        // Ausgewähltes Vorschau-Feld zeigen
        const selectedPreview = vorschauContainer.querySelector(`.vorschau-${ausgewaehlterTyp}`);
        if (selectedPreview) {
            selectedPreview.style.display = 'block';
        }
    }
}



// FORMULAR-LOGIK (Validierung & Datensammlung)


// Formular validieren - alle Pflichtfelder prüfen
function validateForm() {
    const form = document.querySelector('form.card');
    if (!form) return false;

    let isValid = true;

    const titelInput = form.querySelector('input[placeholder="Titel"]');
    if (!titelInput || !titelInput.value.trim()) {
        showError(titelInput, 'Titel ist erforderlich');
        isValid = false;
    } else {
        clearError(titelInput);
    }

    const frageBlocks = document.querySelectorAll('.frage-block');
    if (frageBlocks.length === 0) {
        alert('Mindestens eine Frage ist erforderlich!');
        isValid = false;
    }

    frageBlocks.forEach((block, index) => {
        const frageTitel = block.querySelector('input[placeholder="Frage"]');
        if (!frageTitel || !frageTitel.value.trim()) {
            showError(frageTitel, `Frage ${index + 1} fehlt`);
            isValid = false;
        } else {
            clearError(frageTitel);
        }

        // Prüfen, ob der Typ radio oder checkbox ist
        let isRadioOrCheckbox = false;
        const radioType = block.querySelector('.type-radio');
        const checkboxType = block.querySelector('.type-checkbox');

        if (radioType && radioType.checked) isRadioOrCheckbox = true;
        if (checkboxType && checkboxType.checked) isRadioOrCheckbox = true;

        // Nur bei radio/checkbox Antworten prüfen
        if (isRadioOrCheckbox) {
            const antwortenListe = block.querySelector('.antworten-liste');
            if (antwortenListe) {
                const antwortInputs = antwortenListe.querySelectorAll('.feld');
                let ausgefuellteAntworten = 0;

                antwortInputs.forEach(input => {
                    if (input.value.trim()) {
                        ausgefuellteAntworten++;
                    }
                });

                if (ausgefuellteAntworten < 2) {
                    const ersteAntwort = antwortInputs[0];
                    if (ersteAntwort) {
                        showError(ersteAntwort, `Mindestens 2 Antworten erforderlich (${ausgefuellteAntworten}/2)`);
                    }
                    isValid = false;
                } else {
                    antwortInputs.forEach(input => clearError(input));
                }
            }
        }
    });

    return isValid;
}

// Alle Daten aus dem Formular sammeln und als Objekt zurückgeben
function collectSurveyData() {
    const form = document.querySelector('form.card');
    if (!form) return null;

    const titelInput = form.querySelector('input[placeholder="Titel"]');
    const beschreibungInput = form.querySelector('input[placeholder*="Beschreibung"]');

    const titel = titelInput ? titelInput.value.trim() : '';
    const beschreibung = beschreibungInput ? beschreibungInput.value.trim() : '';

    const fragen = [];
    const frageBlocks = document.querySelectorAll('.frage-block');

    frageBlocks.forEach(block => {
        const frageTitel = block.querySelector('input[placeholder="Frage"]');

        // Typ aus allen 7 Options lesen
        let typ = 'radio';
        fragetypen.forEach((fragetyp) => {
            const typeInput = block.querySelector(`.type-${fragetyp.id}`);
            if (typeInput && typeInput.checked) {
                typ = fragetyp.id;
            }
        });

        // Bei radio/checkbox: Antworten sammeln
        let antworten = [];
        if (typ === 'radio' || typ === 'checkbox') {
            const antwortenListe = block.querySelector('.antworten-liste');
            if (antwortenListe) {
                const antwortInputs = antwortenListe.querySelectorAll('.feld');
                antwortInputs.forEach(input => {
                    const value = input.value.trim();
                    if (value) {
                        antworten.push(value);
                    }
                });
            }
        }
        // Bei anderen Typen: Antworten leer lassen

        fragen.push({
            frage: frageTitel ? frageTitel.value.trim() : '',
            typ: typ,
            antworten: antworten
        });
    });

    return {
        titel: titel,
        beschreibung: beschreibung,
        fragen: fragen
    };
}



// VORSCHAU-LOGIK


// Live-Vorschau aktualisieren
function updatePreview() {
    const data = collectSurveyData();
    const previewContent = document.getElementById('preview-content');

    if (!previewContent) return;

    previewContent.innerHTML = renderPreview(data);
}

// HTML für die Vorschau erzeugen
function renderPreview(data) {
    if (!data || !data.fragen || data.fragen.length === 0) {
        return '<p class="sidebar-text">Noch keine Daten...</p>';
    }

    let html = '';

    if (data.titel) {
        html += `<h3 class="titel_umfrage">${entferneHtml(data.titel)}</h3>`;
    }

    if (data.beschreibung) {
        html += `<p class="sidebar-text" style="margin-bottom: 20px;">${entferneHtml(data.beschreibung)}</p>`;
    }

    data.fragen.forEach((frage, index) => {
        html += `<div class="preview-frage">`;

        if (frage.frage) {
            html += `<p class="preview-frage-text">${index + 1}. ${entferneHtml(frage.frage)}</p>`;
        }

        // Bei radio/checkbox: Antwortmöglichkeiten zeigen
        if (frage.typ === 'radio' || frage.typ === 'checkbox') {
            if (frage.antworten && frage.antworten.length > 0) {
                frage.antworten.forEach(antwort => {
                    html += `<label class="preview-option">`;
                    html += `<input type="${frage.typ}" disabled>`;
                    html += `${entferneHtml(antwort)}`;
                    html += `</label>`;
                });
            }
        }
        // Bei text/number/date/email: Ein Eingabefeld zeigen
        else if (frage.typ === 'text' || frage.typ === 'number' || frage.typ === 'date' || frage.typ === 'email') {
            const placeholder = frage.typ === 'text' ? 'Ihre Antwort...' :
                frage.typ === 'number' ? 'Zahl...' :
                    frage.typ === 'email' ? 'E-Mail...' : '';
            html += `<label class="preview-option">`;
            html += `<input type="${frage.typ}" disabled placeholder="${placeholder}" style="width: 100%; border: none; background: transparent; padding: 0; margin: 0;">`;
            html += `</label>`;
        }
        // Bei range: Slider zeigen (1-5)
        else if (frage.typ === 'range') {
            html += `<label class="preview-option" style="flex-direction: column; align-items: flex-start; gap: 5px;">`;
            html += `<input type="range" min="1" max="5" value="3" disabled style="width: 100%;">`;
            html += `</label>`;
        }

        html += `</div>`;
    });

    return html;
}



// HELPER-FUNKTIONEN


// HTML entfernen gegen XSS
function entferneHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Zeige Fehler an - roter Rahmen und Fehlermeldung
function showError(element, message) {
    element.classList.add('error');

    let errorMsg = element.nextElementSibling;
    if (!errorMsg || !errorMsg.classList.contains('error-message')) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        element.parentNode.insertBefore(errorMsg, element.nextElementSibling);
    }
    errorMsg.textContent = message;
}

// Entferne Fehler
function clearError(element) {
    element.classList.remove('error');

    const errorMsg = element.nextElementSibling;
    if (errorMsg && errorMsg.classList.contains('error-message')) {
        errorMsg.remove();
    }
}



// EVENT LISTENER & INITIALISIERUNG


// Startet wenn die Seite geladen ist
let pageInitialized = false;
document.addEventListener('DOMContentLoaded', () => {
    if (pageInitialized) return;
    pageInitialized = true;

    const currentPage = window.location.pathname.split('/').pop();

    // Admin-Bereich: Umfragen-Liste rendern
    if (currentPage === 'umfragen.html') {
        rendereUmfragenListe();
    }

    // Startseite: Umfragen rendern
    if (currentPage === '' || currentPage === 'index.php') {
        rendereUmfragenAufStartseite();
    }

    // User-Bereich: Umfrage rendern
    if (currentPage === 'survey.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const umfrageId = urlParams.get('id');
        if (umfrageId) {
            rendereUmfrageFuerUser(umfrageId);
        }
    }

    // User-Bereich: Danke-Seite rendern
    if (currentPage === 'danke.html') {
        rendereDankeSeite();
    }

    // Nur auf create.html: Formular-Initialisierung
    const form = document.querySelector('form.card');
    if (form) {
        // Event Listener für "+ Antwort hinzufügen"-Buttons
        const addAntwortBtns = document.querySelectorAll('.btn-add-antwort');
        addAntwortBtns.forEach(btn => {
            const frageBlock = btn.closest('.frage-block');
            btn.addEventListener('click', () => addAntwort(frageBlock));
        });

        // Event Listener für "+ Neue Frage hinzufügen"-Button
        const addFrageBtn = document.querySelector('.btn-add-frage');
        if (addFrageBtn) {
            addFrageBtn.addEventListener('click', addFrage);
        }

        // Event Listener für Typ-Wechsel bei bestehenden Fragen (alle 7 Typen)
        const frageBlocks = document.querySelectorAll('.frage-block');
        frageBlocks.forEach(block => {
            fragetypen.forEach((typ) => {
                const typeInput = block.querySelector(`.type-${typ.id}`);
                if (typeInput) {
                    typeInput.addEventListener('change', () => {
                        wechsleAntworttyp(block);
                        updatePreview();
                    });
                }
            });

            // Vorschau-Felder für bestehende Fragen erstellen (falls noch nicht vorhanden)
            if (!block.querySelector('.vorschau-container')) {
                const vorschauContainer = document.createElement('div');
                vorschauContainer.className = 'vorschau-container';
                vorschauContainer.style.display = 'none';

                const vorschauLabel = document.createElement('label');
                vorschauLabel.className = 'feld-label';
                vorschauLabel.textContent = 'Vorschau';
                vorschauContainer.appendChild(vorschauLabel);

                const textPreview = document.createElement('input');
                textPreview.className = 'feld vorschau-text';
                textPreview.type = 'text';
                textPreview.placeholder = 'Texteingabe...';
                textPreview.disabled = true;
                textPreview.style.display = 'none';
                vorschauContainer.appendChild(textPreview);

                const numberPreview = document.createElement('input');
                numberPreview.className = 'feld vorschau-number';
                numberPreview.type = 'number';
                numberPreview.placeholder = 'Zahl...';
                numberPreview.disabled = true;
                numberPreview.style.display = 'none';
                vorschauContainer.appendChild(numberPreview);

                const datePreview = document.createElement('input');
                datePreview.className = 'feld vorschau-date';
                datePreview.type = 'date';
                datePreview.disabled = true;
                datePreview.style.display = 'none';
                vorschauContainer.appendChild(datePreview);

                const emailPreview = document.createElement('input');
                emailPreview.className = 'feld vorschau-email';
                emailPreview.type = 'email';
                emailPreview.placeholder = 'E-Mail...';
                emailPreview.disabled = true;
                emailPreview.style.display = 'none';
                vorschauContainer.appendChild(emailPreview);

                const rangePreview = document.createElement('input');
                rangePreview.className = 'feld-range vorschau-range';
                rangePreview.type = 'range';
                rangePreview.min = '1';
                rangePreview.max = '5';
                rangePreview.value = '3';
                rangePreview.disabled = true;
                rangePreview.style.display = 'none';
                vorschauContainer.appendChild(rangePreview);

                block.appendChild(vorschauContainer);
            }

            // Delete-Button für bestehende Fragen hinzufügen
            addFrageDeleteButton(block);
        });

        // Event Listener für Lösch-Buttons bei bestehenden Antworten
        const antwortenListen = document.querySelectorAll('.antworten-liste');
        antwortenListen.forEach(antwortenListe => {
            const answers = antwortenListe.children;
            for (let i = 0; i < answers.length; i++) {
                const answerDiv = answers[i];
                const label = answerDiv.querySelector('.option');

                if (label) {
                    const existingDeleteBtn = label.querySelector('.btn-delete-klein');

                    // Falls noch kein Lösch-Button im Label da ist, einen hinzufügen
                    if (!existingDeleteBtn) {
                        const loeschBtn = document.createElement('button');
                        loeschBtn.className = 'btn-delete-klein';
                        loeschBtn.type = 'button';
                        loeschBtn.innerHTML = '<img src="../src/icons/delete.svg" style="width: 16px; height: 16px;">';
                        loeschBtn.addEventListener('click', () => deleteElement(answerDiv, antwortenListe));

                        label.appendChild(loeschBtn);
                    }
                }
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isValid = validateForm();
            if (!isValid) {
                alert('Bitte fülle alle Pflichtfelder aus!');
                return;
            }

            const submitBtn = form.querySelector('input[type="submit"]');
            const originalValue = submitBtn.value;
            submitBtn.value = 'Speichern...';
            submitBtn.disabled = true;

            const surveyData = collectSurveyData();

            try {
                const id = await speichereUmfrage(surveyData);

                if (id) {
                    alert('Umfrage erfolgreich gespeichert!');
                    window.location.href = '/umfrage/index.php';
                } else {
                    alert('Fehler beim Speichern der Umfrage!');
                    submitBtn.value = originalValue;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                alert('Fehler: ' + error.message);
                submitBtn.value = originalValue;
                submitBtn.disabled = false;
            }
        });

        // Live-Vorschau beim Laden initialisieren
        updatePreview();

        // Event Listener für alle Inputs für Live-Vorschau
        const inputs = form.querySelectorAll('.feld');
        inputs.forEach(input => {
            input.addEventListener('input', updatePreview);
        });

        const radios = form.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', updatePreview);
        });
    }
});

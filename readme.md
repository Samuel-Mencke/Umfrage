# Umfrage Tool

[Projekt Übersicht](src/screenshots/umfrage.png)


## Projektbeschreibung

Ein webbasiertes Umfrage Tool zur Erstellung und Durchführung von Umfragen. Benutzer können Umfragen erstellen verwalten und öffentlich zur Verfügung stellen.

[Screenshot](src/screenshots/Admin-umfragen-overview.png)

[Admin erstellen](src/screenshots/Admin-neue-umfrage.png)


## Technologie

PHP 7.4 oder höher, MySQL Datenbank, HTML5, CSS3, JavaScript


## Datenbank

MySQL Datenbank mit Tabellen für Umfragen Fragen Antwortoptionen und Teilnehmerantworten. Das Schema befindet sich in database/schema.sql


## Installation

Kopiere die Dateien auf einen Webserver mit PHP und MySQL Unterstützung. Importiere das Datenbankschema in deine Datenbank und passe die config.php an deine Datenbankzugangsdaten an.


## Funktionen

Erstellen und Verwalten von Umfragen, verschiedene Fragetypen wie Radio Checkbox Text Number Date Email Range, öffentliche Umfrageteilnahme, IP Adressspeicherung, Admin Bereich


## Struktur

index.php Hauptseite mit Umfrageliste, public/survey.html öffentliche Umfrageseite, admin/ Admin Bereich mit Umfragenverwaltung, config.php Datenbankkonfiguration, database/schema.sql Datenbankschema, script.js Frontend Logik, style.css Styling


## Lizenz

MIT

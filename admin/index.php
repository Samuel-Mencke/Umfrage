<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="utf-8">
    <title>Admin - Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../style.css">
</head>

<body>

    <!-- SEITENLEISTE -->
    <div class="sidebar">

        <div class="titel-sidebar">
            <span class="sitbarlayout">Admin</span>
        </div>

        <h1 class="sidebar-titel">Dashboard</h1>

        <div style="margin-top: 30px;">
            <a href="index.php" class="nav-active"
                style="display: flex; align-items: center; padding: 8px 0; color: var(--schwarz); text-decoration: none; font-size: 15px;">
                <img src="../src/icons/dashboard.svg" class="nav-icon" alt="">
                Dashboard
            </a>
            <a href="umfragen.html"
                style="display: flex; align-items: center; padding: 8px 0; color: var(--schwarz); text-decoration: none; font-size: 15px;">
                <img src="../src/icons/surveys.svg" class="nav-icon" alt="">
                Umfragen
            </a>
            <a href="create.html"
                style="display: flex; align-items: center; padding: 8px 0; color: var(--schwarz); text-decoration: none; font-size: 15px;">
                <img src="../src/icons/add.svg" class="nav-icon" alt="">
                Neue Umfrage
            </a>
            <button onclick="logout()"
                style="background: none; border: none; padding: 8px 0; cursor: pointer; text-align: left; font-size: 15px; color: #dc3545; margin-top: 20px; width: 100%;">
                Abmelden
            </button>
        </div>

    </div>

    <!-- HAUPTBEREICH -->
    <div class="main">

        <div class="card" style="max-width: 600px;">

            <h2 class="titel_umfrage">Dashboard</h2>
            <hr>

            <div
                style="padding: 20px; border-radius: 12px; border: 1.5px solid var(--rand); background: var(--grau-hell); margin-bottom: 12px;">
                <p class="sidebar-text">Statistiken (später)</p>
            </div>

            <div
                style="padding: 20px; border-radius: 12px; border: 1.5px solid var(--rand); background: var(--grau-hell); margin-bottom: 12px;">
                <p class="sidebar-text">Auswertungen (später)</p>
            </div>

        </div>

    </div>

    <script src="auth.js"></script>
    <script>
        checkAuth();
    </script>
</body>

</html>
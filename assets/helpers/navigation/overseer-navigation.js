// ═══════════════════════════════════════════════════════════
// VAULT 215 OVERSEER HAMBURGER NAVIGATION SYSTEM
// Authority Console — Blue & Gold Theme
// Slides in from left, highlights current page
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    // Create hamburger menu HTML
    const menuHTML = `
        <!-- HAMBURGER TOGGLE BUTTON -->
        <button id="hamburgerBtn" class="hamburger-btn" title="Open Menu" aria-expanded="false">
            <span class="hamburger-icon">☰</span>
        </button>

        <!-- NAVIGATION MENU -->
        <nav id="sideNav" class="side-nav">
            <button id="closeBtn" class="close-btn">✕</button>
            <div class="nav-header">
                <div class="nav-authority-badge">⬡</div>
                <div class="nav-title">VAULT 215 OVERSEER</div>
                <div class="nav-subtitle">AUTHORITY CONSOLE</div>
                <div id="navCampaignName" class="nav-campaign-display"></div>
            </div>
            <ul class="nav-list">
                <li><a href="overseerhub.html" class="nav-link" data-page="overseerhub">🖥️ OVERSEER HUB</a></li>
                <li><a href="overseercrafting.html" class="nav-link" data-page="overseercrafting">🛠️ CRAFTING</a></li>
                <li><a href="overseerenemypool.html" class="nav-link" data-page="overseerenemypool">👹 ENEMY POOL</a></li>
                <li><a href="overseeritemspool.html" class="nav-link" data-page="overseeritemspool">📦 ITEMS POOL</a></li>
                <li><a href="overseermessages.html" class="nav-link" data-page="overseermessages">📻 MESSAGES</a></li>
                <li><a href="overseerplayeroverview.html" class="nav-link" data-page="overseerplayeroverview">👥 PLAYER OVERVIEW</a></li>
                <li><a href="overseersetting.html" class="nav-link" data-page="overseersetting">⚙️ SETTINGS</a></li>
            </ul>
            <div class="logout-container">
                <button id="logoutBtn" class="logout-button">🚪 LOGOUT</button>
            </div>
        </nav>

        <!-- OVERLAY BACKDROP -->
        <div id="navOverlay" class="nav-overlay"></div>

        <!-- TERMINAL BUTTON (top-right) -->
        <div id="overseerTerminal" class="overseer-terminal-access">
            <a href="terminal.html" class="overseer-terminal-btn">🖥️ TERMINAL</a>
        </div>
    `;

    // Insert menu at start of body
    document.body.insertAdjacentHTML('afterbegin', menuHTML);

    // Create and inject CSS
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        /* ═══════════════════════════════════════════════════════════
           VAULT 215 OVERSEER HAMBURGER MENU STYLES
           Authority Console — Blue & Gold Theme
           ═══════════════════════════════════════════════════════════ */

        :root {
            --overseer-dark: #0a1628;
            --overseer-blue-mid: #0d2045;
            --overseer-blue-bright: #1a3a6e;
            --overseer-gold: #d4a017;
            --overseer-gold-bright: #f0c040;
            --overseer-gold-dim: #8b6914;
            --overseer-white: #e8e8e8;
            --overseer-red-bright: #ff3300;
        }

        /* HAMBURGER BUTTON */
        .hamburger-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background-color: var(--overseer-blue-mid);
            border: 2px solid var(--overseer-gold);
            color: var(--overseer-gold);
            width: 50px;
            height: 50px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            text-shadow: 0 0 10px var(--overseer-gold);
            box-shadow: 0 0 15px rgba(212, 160, 23, 0.4);
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }

        .hamburger-btn:hover {
            background-color: var(--overseer-dark);
            box-shadow: 0 0 25px rgba(212, 160, 23, 0.7);
            border-color: var(--overseer-gold-bright);
            color: var(--overseer-gold-bright);
            text-shadow: 0 0 15px var(--overseer-gold-bright);
            transform: scale(1.05);
        }

        .hamburger-btn:active {
            transform: scale(0.95);
        }

        /* SIDE NAVIGATION MENU */
        .side-nav {
            position: fixed;
            left: -350px;
            top: 0;
            width: 300px;
            height: 100vh;
            background-color: var(--overseer-dark);
            border-right: 3px solid var(--overseer-gold);
            box-shadow: 5px 0 30px rgba(212, 160, 23, 0.4);
            z-index: 999;
            transition: left 0.4s ease;
            overflow-y: auto;
            padding-top: 20px;
        }

        /* SCANLINE EFFECT ON NAV PANEL */
        .side-nav::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15),
                rgba(0, 0, 0, 0.15) 1px,
                transparent 1px,
                transparent 3px
            );
            pointer-events: none;
            z-index: 1;
        }

        .side-nav > * {
            position: relative;
            z-index: 2;
        }

        .side-nav.active {
            left: 0;
        }

        /* CLOSE BUTTON */
        .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background-color: var(--overseer-blue-mid);
            border: 2px solid var(--overseer-gold);
            color: var(--overseer-gold);
            width: 40px;
            height: 40px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            text-shadow: 0 0 5px var(--overseer-gold);
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            z-index: 3;
        }

        .close-btn:hover {
            background-color: var(--overseer-dark);
            border-color: var(--overseer-gold-bright);
            color: var(--overseer-gold-bright);
            text-shadow: 0 0 10px var(--overseer-gold-bright);
        }

        /* MENU HEADER */
        .nav-header {
            text-align: center;
            padding: 20px 15px;
            border-bottom: 2px solid var(--overseer-gold);
            margin-bottom: 20px;
            background-color: var(--overseer-blue-mid);
        }

        .nav-authority-badge {
            color: var(--overseer-gold-bright);
            font-size: 28px;
            text-shadow: 0 0 12px var(--overseer-gold-bright), 0 0 24px rgba(240, 192, 64, 0.5);
            line-height: 1;
            margin-bottom: 6px;
        }

        .nav-title {
            color: var(--overseer-gold);
            font-size: 16px;
            font-weight: bold;
            text-shadow: 0 0 10px var(--overseer-gold), 0 0 20px rgba(212, 160, 23, 0.4);
            letter-spacing: 2px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        }

        .nav-subtitle {
            color: var(--overseer-gold-dim);
            font-size: 10px;
            text-shadow: 0 0 5px var(--overseer-gold-dim);
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 5px;
            font-family: 'Courier New', monospace;
        }

        .nav-campaign-display {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            color: rgba(212, 160, 23, 0.6);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 6px;
            min-height: 14px;
        }

        /* NAVIGATION LIST */
        .nav-list {
            list-style: none;
            padding: 0 10px;
        }

        .nav-list li {
            margin-bottom: 10px;
        }

        /* NAVIGATION LINKS */
        .nav-link {
            display: block;
            padding: 15px 15px;
            background-color: var(--overseer-blue-mid);
            border: 2px solid var(--overseer-blue-bright);
            color: var(--overseer-white);
            text-decoration: none;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.3s ease;
            box-shadow: 0 0 8px rgba(26, 58, 110, 0.3);
        }

        .nav-link:hover {
            background-color: var(--overseer-blue-bright);
            border-color: var(--overseer-gold);
            color: var(--overseer-gold-bright);
            text-shadow: 0 0 10px var(--overseer-gold-bright);
            box-shadow: 0 0 20px rgba(212, 160, 23, 0.4);
            transform: translateX(5px);
        }

        /* ACTIVE PAGE HIGHLIGHT */
        .nav-link.active {
            background-color: var(--overseer-blue-bright);
            border-color: var(--overseer-gold);
            color: var(--overseer-gold-bright);
            text-shadow: 0 0 15px var(--overseer-gold-bright);
            box-shadow: 0 0 20px rgba(212, 160, 23, 0.5), inset 0 0 10px rgba(212, 160, 23, 0.15);
        }

        /* LOGOUT BUTTON */
        .logout-container {
            padding: 10px 10px 20px;
            border-top: 2px solid var(--overseer-gold-dim);
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .logout-button {
            display: block;
            width: 100%;
            padding: 15px 15px;
            background-color: var(--overseer-blue-mid);
            border: 2px solid var(--overseer-red-bright);
            color: var(--overseer-red-bright);
            text-decoration: none;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: bold;
            text-shadow: 0 0 5px var(--overseer-red-bright);
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.3s ease;
            box-shadow: 0 0 10px rgba(255, 51, 0, 0.25);
            text-align: left;
        }

        .logout-button:hover {
            background-color: var(--overseer-dark);
            border-color: var(--overseer-red-bright);
            color: var(--overseer-red-bright);
            text-shadow: 0 0 12px var(--overseer-red-bright);
            box-shadow: 0 0 20px rgba(255, 51, 0, 0.5);
            transform: translateX(5px);
        }

        .logout-button:active {
            transform: scale(0.98);
        }

        /* OVERLAY BACKDROP */
        .nav-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(4, 8, 15, 0.8);
            z-index: 998;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .nav-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
            .side-nav {
                width: 250px;
            }

            .hamburger-btn {
                width: 45px;
                height: 45px;
                font-size: 20px;
            }
        }

        @media (max-width: 480px) {
            .side-nav {
                width: 200px;
            }

            .nav-link {
                padding: 12px 10px;
                font-size: 11px;
            }
        }

        /* TERMINAL ACCESS BUTTON (top-right) */
        .overseer-terminal-access {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }

        .overseer-terminal-btn {
            background-color: var(--overseer-blue-mid);
            border: 2px solid var(--overseer-gold);
            color: var(--overseer-gold);
            padding: 8px 14px;
            text-decoration: none;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 1px;
            text-shadow: 0 0 5px var(--overseer-gold);
            box-shadow: 0 0 10px rgba(212, 160, 23, 0.2);
            transition: all 0.3s ease;
            display: inline-block;
        }

        .overseer-terminal-btn:hover {
            background-color: var(--overseer-dark);
            border-color: var(--overseer-gold-bright);
            color: var(--overseer-gold-bright);
            text-shadow: 0 0 10px var(--overseer-gold-bright);
            box-shadow: 0 0 20px rgba(212, 160, 23, 0.4);
        }
    `;
    document.head.appendChild(styleSheet);

    // ═══════════════════════════════════════════════════════════
    // HAMBURGER MENU FUNCTIONALITY
    // ═══════════════════════════════════════════════════════════

    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sideNav = document.getElementById('sideNav');
    const navOverlay = document.getElementById('navOverlay');
    const navLinks = document.querySelectorAll('.nav-link');

    // Determine current page
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('overseerplayeroverview')) return 'overseerplayeroverview';
        if (path.includes('overseercrafting')) return 'overseercrafting';
        if (path.includes('overseerenemypool')) return 'overseerenemypool';
        if (path.includes('overseeritemspool')) return 'overseeritemspool';
        if (path.includes('overseermessages')) return 'overseermessages';
        if (path.includes('overseersetting')) return 'overseersetting';
        if (path.includes('overseerhub')) return 'overseerhub';
        return null;
    }

    // Highlight the current active page link
    const currentPage = getCurrentPage();
    if (currentPage) {
        navLinks.forEach(link => {
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // Open the navigation menu
    function openMenu() {
        sideNav.classList.add('active');
        navOverlay.classList.add('active');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
    }

    // Close the navigation menu
    function closeMenu() {
        sideNav.classList.remove('active');
        navOverlay.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
    }

    // Event listeners
    hamburgerBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    navOverlay.addEventListener('click', closeMenu);

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');

    function logout() {
        closeMenu();
        sessionStorage.clear();
        window.location.href = '../login.html';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Show current campaign name
    var campaignId = sessionStorage.getItem('campaignId');
    if (campaignId) {
        var navCampaignEl = document.getElementById('navCampaignName');
        if (navCampaignEl) {
            navCampaignEl.textContent = '⚑ ' + (sessionStorage.getItem('campaignName') || campaignId);
        }
    }

    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sideNav.classList.contains('active')) {
            closeMenu();
        }
    });
});

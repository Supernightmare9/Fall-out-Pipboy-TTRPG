// ═══════════════════════════════════════════════════════════
// VAULT 215 HAMBURGER NAVIGATION SYSTEM
// Slides in from left, highlights current page
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
    // Create hamburger menu HTML
    const menuHTML = `
        <!-- HAMBURGER TOGGLE BUTTON -->
        <button id="hamburgerBtn" class="hamburger-btn" title="Open Menu">
            <span class="hamburger-icon">☰</span>
        </button>

        <!-- NAVIGATION MENU -->
        <nav id="sideNav" class="side-nav">
            <button id="closeBtn" class="close-btn">✕</button>
            <div class="nav-header">
                <div class="nav-title">VAULT 215</div>
                <div class="nav-subtitle">NAVIGATION SYSTEM</div>
            </div>
            <ul class="nav-list">
                <li><a href="character.html" class="nav-link" data-page="character">⚔ CHARACTER</a></li>
                <li><a href="stats.html" class="nav-link" data-page="stats">📊 STATS</a></li>
                <li><a href="inventory.html" class="nav-link" data-page="inventory">🎒 INVENTORY</a></li>
                <li><a href="data.html" class="nav-link" data-page="data">📋 DATA</a></li>
                <li><a href="messages.html" class="nav-link" data-page="messages">📻 MESSAGES</a></li>
            </ul>
            <div class="logout-container">
                <button id="logoutBtn" class="logout-button">🚪 LOGOUT</button>
            </div>
        </nav>

        <!-- OVERLAY BACKDROP -->
        <div id="navOverlay" class="nav-overlay"></div>
    `;

    // Insert menu at start of body
    document.body.insertAdjacentHTML('afterbegin', menuHTML);

    // Create and inject CSS
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        /* ═══════════════════════════════════════════════════════════
           VAULT 215 HAMBURGER MENU STYLES
           ═══════════════════════════════════════════════════════════ */

        :root {
            --vault-green: #4ade80;
            --vault-gold: #fbbf24;
            --vault-dark: #0a0a0a;
            --vault-darker: #1a1a1a;
        }

        /* HAMBURGER BUTTON */
        .hamburger-btn {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background-color: var(--vault-darker);
            border: 2px solid var(--vault-green);
            color: var(--vault-green);
            width: 50px;
            height: 50px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            text-shadow: 0 0 10px var(--vault-green);
            box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }

        .hamburger-btn:hover {
            background-color: var(--vault-dark);
            box-shadow: 0 0 25px rgba(74, 222, 128, 0.6);
            border-color: var(--vault-gold);
            color: var(--vault-gold);
            text-shadow: 0 0 15px var(--vault-gold);
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
            background-color: var(--vault-darker);
            border-right: 3px solid var(--vault-green);
            box-shadow: 5px 0 30px rgba(74, 222, 128, 0.4);
            z-index: 999;
            transition: left 0.4s ease;
            overflow-y: auto;
            padding-top: 20px;
        }

        .side-nav.active {
            left: 0;
        }

        /* CLOSE BUTTON */
        .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background-color: transparent;
            border: 2px solid var(--vault-green);
            color: var(--vault-green);
            width: 40px;
            height: 40px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            text-shadow: 0 0 5px var(--vault-green);
            transition: all 0.3s ease;
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }

        .close-btn:hover {
            background-color: var(--vault-dark);
            border-color: var(--vault-gold);
            color: var(--vault-gold);
            text-shadow: 0 0 10px var(--vault-gold);
        }

        /* MENU HEADER */
        .nav-header {
            text-align: center;
            padding: 20px 15px;
            border-bottom: 2px solid var(--vault-green);
            margin-bottom: 20px;
        }

        .nav-title {
            color: var(--vault-gold);
            font-size: 18px;
            font-weight: bold;
            text-shadow: 0 0 10px var(--vault-gold);
            letter-spacing: 2px;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
        }

        .nav-subtitle {
            color: var(--vault-green);
            font-size: 10px;
            text-shadow: 0 0 5px var(--vault-green);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 5px;
            font-family: 'Courier New', monospace;
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
            background-color: var(--vault-dark);
            border: 2px solid var(--vault-green);
            color: var(--vault-green);
            text-decoration: none;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: bold;
            text-shadow: 0 0 5px var(--vault-green);
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.3s ease;
            box-shadow: 0 0 10px rgba(74, 222, 128, 0.2);
        }

        .nav-link:hover {
            background-color: var(--vault-darker);
            border-color: var(--vault-gold);
            color: var(--vault-gold);
            text-shadow: 0 0 10px var(--vault-gold);
            box-shadow: 0 0 20px rgba(74, 222, 128, 0.5);
            transform: translateX(5px);
        }

        /* ACTIVE PAGE HIGHLIGHT */
        .nav-link.active {
            background-color: #2d5016;
            border-color: var(--vault-gold);
            color: var(--vault-gold);
            text-shadow: 0 0 15px var(--vault-gold);
            box-shadow: 0 0 20px rgba(251, 191, 36, 0.5), inset 0 0 10px rgba(251, 191, 36, 0.2);
        }

        /* LOGOUT BUTTON */
        .logout-container {
            padding: 10px 10px 20px;
            border-top: 2px solid var(--vault-green);
            margin-top: 10px;
        }

        .logout-button {
            display: block;
            width: 100%;
            padding: 15px 15px;
            background-color: var(--vault-dark);
            border: 2px solid #ff6b6b;
            color: #ff6b6b;
            text-decoration: none;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            font-weight: bold;
            text-shadow: 0 0 5px #ff6b6b;
            letter-spacing: 1px;
            text-transform: uppercase;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.3s ease;
            box-shadow: 0 0 10px rgba(255, 107, 107, 0.2);
            text-align: left;
        }

        .logout-button:hover {
            background-color: var(--vault-darker);
            border-color: var(--vault-gold);
            color: var(--vault-gold);
            text-shadow: 0 0 10px var(--vault-gold);
            box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
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
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 998;
            display: none;
            transition: display 0.3s ease;
        }

        .nav-overlay.active {
            display: block;
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
        if (path.includes('character')) return 'character';
        if (path.includes('stats')) return 'stats';
        if (path.includes('inventory')) return 'inventory';
        if (path.includes('data')) return 'data';
        if (path.includes('messages')) return 'messages';
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
        localStorage.clear();
        window.location.href = 'index.html';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sideNav.classList.contains('active')) {
            closeMenu();
        }
    });
});


// ═══════════════════════════════════════════════════════════════════════════════
// PARABOLIX — Tool Page Auth Check
// Include this in individual tool pages to enforce authentication.
// If user is logged in (via dashboard) or on a trusted device, they get
// direct access. Otherwise, they're redirected to the main login.
// ═══════════════════════════════════════════════════════════════════════════════

(function() {
    // Determine which app this is from the URL path
    const path = window.location.pathname;
    const appMatch = path.match(/\/(resolver|rms|pattern|kingpost|simulsat|lookangles)\//);
    const currentApp = appMatch ? appMatch[1] : null;

    // Check session
    const session = ParabolixAuth.getSession();

    if (!session) {
        // Not logged in — redirect to main login
        window.location.href = '../index.html';
        return;
    }

    // Check app access
    if (currentApp && !ParabolixAuth.canAccessApp(currentApp)) {
        alert('You do not have access to this tool. Contact admin.');
        window.location.href = '../index.html';
        return;
    }

    // User is authenticated and authorized — show the app
    // Hide any existing login screen and show app content
    const loginScreen = document.getElementById('loginScreen');
    const appContent = document.getElementById('appContent');

    if (loginScreen) loginScreen.style.display = 'none';
    if (appContent) appContent.style.display = 'block';
})();

// ═══════════════════════════════════════════════════════════════════════════════
// PARABOLIX — Firebase Authentication Bridge
// ═══════════════════════════════════════════════════════════════════════════════
// This replaces the old static auth.js for tools that need Firebase session check.
// Each tool includes this file and calls ParabolixAuth methods as before.
// ═══════════════════════════════════════════════════════════════════════════════

const ParabolixAuth = (function() {

    // Firebase config (Parabolix project)
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyBUb2AtYgcIJrAC_dTyW6-6_RQ59wrewlc",
        authDomain: "parabolix-b82e4.firebaseapp.com",
        projectId: "parabolix-b82e4",
        storageBucket: "parabolix-b82e4.firebasestorage.app",
        messagingSenderId: "1009247065497",
        appId: "1:1009247065497:web:004830da36ac0b4c286f08"
    };

    let _app = null;
    let _auth = null;
    let _db = null;
    let _session = null;
    let _userData = null;
    let _ready = false;
    let _readyCallbacks = [];

    // Initialize Firebase (only once)
    function initFirebase() {
        if (_app) return;
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Include firebase scripts before auth-firebase.js');
            return;
        }
        // Check if already initialized
        if (firebase.apps.length === 0) {
            _app = firebase.initializeApp(FIREBASE_CONFIG);
        } else {
            _app = firebase.apps[0];
        }
        _auth = firebase.auth();
        _db = firebase.firestore();

        // Listen for auth state
        _auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const doc = await _db.collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        _userData = doc.data();
                        _session = {
                            user: _userData.name || user.email,
                            email: user.email,
                            uid: user.uid,
                            role: _userData.role || 'user',
                            apps: getAllowedApps(_userData),
                            trialEnd: _userData.trialEnd || null,
                            trusted: false
                        };
                    } else {
                        _session = {
                            user: user.email,
                            email: user.email,
                            uid: user.uid,
                            role: 'user',
                            apps: [],
                            trusted: false
                        };
                    }
                } catch (e) {
                    // Firestore read failed — still allow if auth succeeded
                    _session = {
                        user: user.email,
                        email: user.email,
                        uid: user.uid,
                        role: 'user',
                        apps: ['resolver', 'rms', 'pattern', 'kingpost', 'simulsat'],
                        trusted: false
                    };
                }
            } else {
                _session = null;
                _userData = null;
            }
            _ready = true;
            _readyCallbacks.forEach(cb => cb());
            _readyCallbacks = [];
        });
    }

    function getAllowedApps(userData) {
        if (!userData) return [];
        if (userData.suspended) return []; // Blocked
        if (userData.role === 'admin') return ['resolver', 'rms', 'pattern', 'kingpost', 'simulsat', 'lookangles', 'los'];

        // Check trial
        if (userData.trialEnd && new Date() < new Date(userData.trialEnd)) {
            return ['resolver', 'rms', 'pattern', 'kingpost', 'simulsat', 'lookangles', 'los'];
        }

        // Check subscriptions
        const subs = userData.subscriptions || {};
        const apps = [];
        for (const [toolId, sub] of Object.entries(subs)) {
            if (sub.active && new Date() < new Date(sub.expiresAt)) {
                apps.push(toolId);
            }
        }
        return apps;
    }

    function onReady(cb) {
        if (_ready) cb();
        else _readyCallbacks.push(cb);
    }

    // ─── Public API (same interface as old auth.js) ───────────────────────

    function login(username, password) {
        // Firebase uses email, but accept username for backward compat
        // This is synchronous return for old UI — actual auth happens via onAuthStateChanged
        // For the old-style tools, we'll handle login differently
        return { success: true, session: _session };
    }

    function getSession() {
        return _session;
    }

    function canAccessApp(appName) {
        if (!_session) return false;
        if (_session.role === 'admin') return true;
        return _session.apps.includes(appName);
    }

    function logout() {
        if (_auth) _auth.signOut();
        _session = null;
        _userData = null;
    }

    function getDeviceId() {
        return 'firebase_' + (_session?.uid || 'unknown');
    }

    function isTrustedDevice() {
        return false;
    }

    function adminResetDevice() { return true; }
    function adminRegisterTrustedDevice() { return getDeviceId(); }

    // Initialize on load
    initFirebase();

    return {
        login,
        logout,
        getSession,
        canAccessApp,
        getDeviceId,
        isTrustedDevice,
        adminResetDevice,
        adminRegisterTrustedDevice,
        onReady,
        USERS: [] // empty — no longer hardcoded
    };

})();

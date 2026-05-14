// ═══════════════════════════════════════════════════════════════════════════════
// PARABOLIX — Centralized Authentication & Subscription System
// ═══════════════════════════════════════════════════════════════════════════════
// Features:
//   1. Per-user app subscriptions (control which tools each user can access)
//   2. Single device lock (one user = one device, enforced via fingerprint)
//   3. Admin bypasses login on individual apps
//   4. Trusted devices auto-access without login
// ═══════════════════════════════════════════════════════════════════════════════

const ParabolixAuth = (function() {

    // ─────────────────────────────────────────────────────────────────────────
    // USER DATABASE
    // Each user has: username, password, role, active status,
    //   apps[] = which tools they can access
    //   deviceId = locked device fingerprint (null = not yet locked)
    // ─────────────────────────────────────────────────────────────────────────
    const USERS = [
        {
            user: 'Admin',
            pass: 'Cumbum@1984',
            role: 'admin',
            active: true,
            apps: ['resolver', 'rms', 'pattern', 'kingpost', 'simulsat', 'lookangles'],
            deviceId: null  // Admin not device-locked
        },
        {
            user: 'User1',
            pass: 'Bangalore@1984',
            role: 'user',
            active: true,
            apps: ['resolver', 'rms', 'pattern', 'kingpost', 'simulsat'],
            deviceId: null  // Will be locked on first login
        },
        // Add more users as needed:
        // {
        //     user: 'User2',
        //     pass: 'SomePassword',
        //     role: 'user',
        //     active: true,
        //     apps: ['pattern', 'rms'],  // Only Pattern & RMS access
        //     deviceId: null
        // },
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // TRUSTED DEVICES — Your devices that bypass login entirely
    // These are device fingerprints that get auto-access as Admin
    // To register your device: login as Admin, open browser console,
    //   type: ParabolixAuth.getDeviceId()
    //   Copy that value and paste it here.
    // ─────────────────────────────────────────────────────────────────────────
    const TRUSTED_DEVICES = [
        // Paste your device IDs here after registering:
        // 'pbx_xxxxxxxx_xxxxxxxx',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // DEVICE FINGERPRINT GENERATION
    // Creates a unique-ish ID per browser+device, stored in localStorage
    // ─────────────────────────────────────────────────────────────────────────
    function generateDeviceId() {
        const nav = navigator;
        const screen = window.screen;
        const raw = [
            nav.userAgent,
            nav.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            nav.hardwareConcurrency || 0,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            new Date().getTimezoneOffset()
        ].join('|');

        // Simple hash
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const c = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash |= 0;
        }
        const hashStr = Math.abs(hash).toString(36);

        // Add random component stored permanently in localStorage
        let stored = localStorage.getItem('pbx_device_seed');
        if (!stored) {
            stored = Math.random().toString(36).substring(2, 10);
            localStorage.setItem('pbx_device_seed', stored);
        }

        return 'pbx_' + hashStr + '_' + stored;
    }

    function getDeviceId() {
        let id = localStorage.getItem('pbx_device_id');
        if (!id) {
            id = generateDeviceId();
            localStorage.setItem('pbx_device_id', id);
        }
        return id;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEVICE LOCK STORAGE
    // Since this is a static site, device locks are stored in localStorage.
    // Format: { username: deviceId }
    // ─────────────────────────────────────────────────────────────────────────
    function getDeviceLocks() {
        try {
            return JSON.parse(localStorage.getItem('pbx_device_locks') || '{}');
        } catch(e) { return {}; }
    }

    function setDeviceLock(username, deviceId) {
        const locks = getDeviceLocks();
        locks[username] = deviceId;
        localStorage.setItem('pbx_device_locks', JSON.stringify(locks));
    }

    function checkDeviceLock(username) {
        const locks = getDeviceLocks();
        const myDevice = getDeviceId();

        if (!locks[username]) {
            // First login — lock to this device
            setDeviceLock(username, myDevice);
            return { allowed: true, firstLogin: true };
        }

        if (locks[username] === myDevice) {
            return { allowed: true, firstLogin: false };
        }

        // Different device!
        return { allowed: false, firstLogin: false, lockedDevice: locks[username] };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRUSTED DEVICE CHECK
    // ─────────────────────────────────────────────────────────────────────────
    function isTrustedDevice() {
        const myDevice = getDeviceId();
        return TRUSTED_DEVICES.includes(myDevice);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────────────
    function login(username, password) {
        const found = USERS.find(x => x.user === username && x.pass === password);

        if (!found) {
            return { success: false, error: 'Invalid username or password.' };
        }
        if (!found.active) {
            return { success: false, error: 'Account disabled. Contact admin.' };
        }

        // Device lock check (skip for admin)
        if (found.role !== 'admin') {
            const lockCheck = checkDeviceLock(found.user);
            if (!lockCheck.allowed) {
                return {
                    success: false,
                    error: 'This account is locked to another device. Contact admin to reset.'
                };
            }
        }

        // Store session in localStorage (persists across tabs and browser restarts)
        const session = {
            user: found.user,
            role: found.role,
            apps: found.apps,
            deviceId: getDeviceId(),
            loginTime: Date.now()
        };
        localStorage.setItem('pbx_session', JSON.stringify(session));

        return { success: true, session: session };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SESSION CHECK
    // ─────────────────────────────────────────────────────────────────────────
    function getSession() {
        // Check trusted device first
        if (isTrustedDevice()) {
            return {
                user: 'Admin',
                role: 'admin',
                apps: ['resolver', 'rms', 'pattern', 'kingpost', 'simulsat', 'lookangles'],
                trusted: true
            };
        }

        try {
            const session = JSON.parse(localStorage.getItem('pbx_session'));
            if (!session) return null;

            // Validate user still exists and is active
            const found = USERS.find(x => x.user === session.user && x.active);
            if (!found) {
                localStorage.removeItem('pbx_session');
                return null;
            }

            // Return session with current app permissions
            return {
                user: found.user,
                role: found.role,
                apps: found.apps,
                trusted: false
            };
        } catch(e) {
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APP ACCESS CHECK — Does current user have access to a specific tool?
    // ─────────────────────────────────────────────────────────────────────────
    function canAccessApp(appName) {
        const session = getSession();
        if (!session) return false;
        if (session.role === 'admin') return true;
        return session.apps.includes(appName);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────────────────────────────────────────
    function logout() {
        localStorage.removeItem('pbx_session');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN: Reset device lock for a user
    // ─────────────────────────────────────────────────────────────────────────
    function adminResetDevice(username) {
        const session = getSession();
        if (!session || session.role !== 'admin') return false;
        const locks = getDeviceLocks();
        delete locks[username];
        localStorage.setItem('pbx_device_locks', JSON.stringify(locks));
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN: Register current device as trusted
    // ─────────────────────────────────────────────────────────────────────────
    function adminRegisterTrustedDevice() {
        const id = getDeviceId();
        console.log('═══════════════════════════════════════════════');
        console.log('YOUR DEVICE ID: ' + id);
        console.log('═══════════════════════════════════════════════');
        console.log('Add this to TRUSTED_DEVICES array in auth.js');
        console.log('Then this device will auto-login without credentials.');
        return id;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────
    return {
        login,
        logout,
        getSession,
        canAccessApp,
        getDeviceId,
        isTrustedDevice,
        adminResetDevice,
        adminRegisterTrustedDevice,
        USERS  // Exposed for admin panel
    };

})();

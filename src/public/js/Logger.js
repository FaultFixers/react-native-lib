function sendClientLogToApi(level, details) {
    const log = {
        source: 'REPORTER_WEB',
        date: (new Date()).toISOString().replace(/\.\d+/, ''),
        level: level.toUpperCase(),
        details,
        environment: {
            userAgent: navigator.userAgent,
            sessionId: window.sessionId,
            deviceId: window.deviceId,
        },
    };

    if (window.userId) {
        log.user = window.userId;
    }

    doApiPostRequest('/client-logs', [log]);

    console[level](...details);
}

window.Logger = {
    trace(...args) {
        console.debug(...args); // eslint-disable-line no-console
    },

    debug(...args) {
        sendClientLogToApi('debug', args);
    },

    info(...args) {
        sendClientLogToApi('info', args);
    },

    warn(...args) {
        sendClientLogToApi('warn', args);
    },

    error(...args) {
        sendClientLogToApi('error', args);
    },
}

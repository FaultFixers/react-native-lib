function sendClientLogToApi(level, details) {
    doApiPostRequest('/client-logs', [{
        source: 'REPORTER_WEB',
        date: (new Date()).toISOString().replace(/\.\d+/, ''),
        level: level.toUpperCase(),
        details,
    }]);

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

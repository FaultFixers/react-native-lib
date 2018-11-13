const api = require('../services/api');

async function loadUserByCookie(req, res, next) {
    if (!req.cookies.authToken) {
        res.locals.user = null;
        res.locals.isLoggedIn = false;
        return next();
    }

    try {
        const response = await api.asUser(req).get('/authentication/self');
        if (response.statusCode !== 200) {
            next(new Error('Could not get self'));
        }

        res.locals.user = response.json.user;
        res.locals.isLoggedIn = true;
        console.log('Active user is', res.locals.user.email);
        next();
    } catch (e) {
        console.error('Error getting user by auth token', req.cookies.authToken, e);

        if (e.headers && e.headers['x-ff-logout'] === 'true') {
            console.warn('Forcing log out as instructed by the core API');
            res.clearCookie('authToken');
            res.redirect(301, '/');
        } else {
            next(e);
        }
    }
}

module.exports = loadUserByCookie;

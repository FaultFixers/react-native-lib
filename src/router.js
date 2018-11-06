const express = require('express');
const router = express.Router();

const controllers = require('./controllers');

function addRoute(method, path, handler) {
    if (typeof handler !== 'function') {
        throw new Error(`Handler for route '${method} ${path}' is not a function`);
    }

    router[method.toLowerCase()](path, async function(req, res, next) {
        try {
            await handler(req, res);
        } catch (e) {
            console.error(`Error in handler for ${method} ${path}`, e);
            next(e);
        }
    });
}

addRoute('GET', '/', controllers.viewIndex);
addRoute('GET', '/buildings/:buildingId', controllers.viewBuilding);
addRoute('GET', '/login', controllers.viewLogin);
addRoute('GET', '/account', controllers.viewAccount);
addRoute('GET', '/other', controllers.viewOther);
addRoute('GET', '/privacy', controllers.viewPrivacy);
addRoute('GET', '/debug-info', controllers.viewDebugInfo);
addRoute('GET', '/forgot-password', controllers.viewForgotPassword);
addRoute('GET', '/reset-password', controllers.viewResetPassword);
addRoute('GET', '/api/check-code', controllers.doCheckCode);
addRoute('POST', '/api/login', controllers.doLogin);
addRoute('POST', '/api/personal-details', controllers.doUpdatePersonalDetails);
addRoute('POST', '/api/change-password', controllers.doChangePassword);
addRoute('POST', '/api/request-password-reset', controllers.doRequestPasswordReset);
addRoute('POST', '/api/reset-password', controllers.doResetPassword);
addRoute('POST', '/log-out', controllers.doLogOut);

module.exports = router;

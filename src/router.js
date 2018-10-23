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
addRoute('GET', '/api/check-code', controllers.doCheckCode);
addRoute('POST', '/api/login', controllers.doLogin);
addRoute('POST', '/api/personal-details', controllers.doUpdatePersonalDetails);
addRoute('POST', '/api/change-password', controllers.doChangePassword);
addRoute('POST', '/log-out', controllers.doLogOut);

module.exports = router;

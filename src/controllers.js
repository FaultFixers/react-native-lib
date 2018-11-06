const api = require('./services/api');
const {getTag} = require('./services/tags');
const {getActiveBuildings, getActiveBuildingById} = require('./services/buildings');
const config = require('../config/load');

function hasHttpStatus(response, expectedStatus) {
    if (response && typeof response.statusCode === 'number') {
        return response.statusCode === expectedStatus;
    } else {
        return false;
    }
}

function getErrorCodes(response) {
    if (!response || !response.json || !response.json.errors) {
        return [];
    }

    const codes = [];
    for (let i = 0; i < response.json.errors.length; i++) {
        const error = response.json.errors[i];
        console.log('error', error);
        if (error.codes) {
            for (let ii = 0; ii < error.codes.length; ii++) {
                codes.push(error.codes[ii]);
            }
        }
    }
    return codes;
}

function containsErrorCode(response, expectedCode) {
    const actualCodes = getErrorCodes(response);
    return actualCodes.indexOf(expectedCode) !== -1;
}

async function viewIndex(req, res) {
    const isAuthenticationRequiredToBrowse = res.locals.website.isAuthenticationRequiredToBrowse;
    let buildings;
    if (isAuthenticationRequiredToBrowse) {
        buildings = await getActiveBuildings(req, res);
    }

    res.render('index', {
        isAuthenticationRequiredToBrowse,
        buildings,
        mainNavActiveTab: 'report',
    });
}

async function viewBuilding(req, res) {
    const buildingId = req.params.buildingId;
    // const buildingResponse = await api.as(req, buildingId);
    // res.locals.ensureIsCorrectAccount(buildingResponse.account);

    // const building = buildingResponse.building;

    // res.render('building', {
    //     building,
    // });
}

async function viewLogin(req, res) {
    const continueTo = req.query.continueTo;

    if (res.locals.isLoggedIn) {
        return res.redirect(continueTo ? continueTo : '/');
    }

    const email = req.query.email;

    res.render('login', {
        mainNavActiveTab: 'other',
        email,
        continueTo,
    });
}

async function viewAccount(req, res) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login?continueTo=/account');
    }

    res.render('account', {
        mainNavActiveTab: 'account',
    });
}

async function viewOther(req, res) {
    res.render('other', {
        mainNavActiveTab: 'other',
    });
}

async function viewPrivacy(req, res) {
    res.render('privacy', {
        mainNavActiveTab: 'other',
    });
}

async function viewDebugInfo(req, res) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login?continueTo=/debug-info');
    }

    res.render('debug-info', {
        mainNavActiveTab: 'other',
        apiHostname: config.apiHostname,
    });
}

async function viewForgotPassword(req, res) {
    if (res.locals.isLoggedIn) {
        return res.redirect('/');
    }

    res.render('forgot-password', {
        mainNavActiveTab: 'other',
    });
}

async function doCheckCode(req, res) {
    // const code = req.query.code;
    // const tag = await getTag(req, code);

    // res.locals.ensureIsCorrectAccount(tag.account);

    // res.json({tag});
}

async function doLogin(req, res) {
    const ONE_DAY_IN_MS = 86400000;
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        res.status(401).json({});
        return;
    }

    try {
        const response = await api.asIntegration().post('/authentication/login', {email, password});
        console.log('Logged in', {email});
        res.cookie('authToken', response.json.authenticationToken, {maxAge: ONE_DAY_IN_MS * 365});
        res.json({user: response.json.user});
    } catch (error) {
        console.log('Failed to login', {error, email});
        res.status(401).json({});
    }
}

async function doUpdatePersonalDetails(req, res) {
    const email = req.body.email;
    const name = req.body.name;
    const phoneNumber = req.body.phoneNumber;

    try {
        const response = await api.asUser(req).put('/users/self', {email, name, phoneNumber});
        console.log('Successfully updated personal details', {email, name, phoneNumber});
        res.json({user: response.json.user});
    } catch (error) {
        console.error('Failed to update personal details', {error});
        res.status(500).json({});
    }
}

async function doChangePassword(req, res) {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;

    try {
        await api.asUser(req).post('/authentication/change-own-password', {oldPassword, newPassword});
        console.log('Successfully changed password');
        res.json({});
    } catch (error) {
        console.error('Failed to change password', {error});
        res.status(422).json({
            isNewPasswordTooShort: containsErrorCode(error, 'Size.newPassword'),
        });
    }
}

async function doRequestPasswordReset(req, res) {
    const email = req.body.email;

    try {
        await api.asIntegration().post('/authentication/request-password-reset', {email});
        console.log('Requested password reset for ' + email);
        res.json({});
    } catch (error) {
        console.error('Failed to request password reset', {email, error});
        res.status(422).json({
            isInvalidEmail: hasHttpStatus(error, 404),
        });
    }
}

async function doLogOut(req, res) {
    res.clearCookie('authToken');
    res.redirect(301, '/');
}

module.exports = {
    viewIndex,
    viewBuilding,
    viewLogin,
    viewAccount,
    viewOther,
    viewPrivacy,
    viewDebugInfo,
    viewForgotPassword,
    doCheckCode,
    doLogin,
    doUpdatePersonalDetails,
    doChangePassword,
    doRequestPasswordReset,
    doLogOut,
};

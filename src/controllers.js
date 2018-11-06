const api = require('./services/api');
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
    const canBrowse = res.locals.isLoggedIn || !res.locals.website.isAuthenticationRequiredToBrowse;
    let buildings;
    if (canBrowse) {
        const domain = req.hostname;
        const buildingsResponse = await api.asIntegration().get(`/reporting-websites/${domain}/buildings`);
        if (buildingsResponse.statusCode !== 200) {
            throw new Error(`Could not get buildings for ${domain}`);
        }

        buildings = buildingsResponse.json.results
            .map(result => result.building)
            .filter(building => building.status === 'ACTIVE')
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    res.render('index', {
        mainNavActiveTab: 'report',
        canBrowse,
        buildings,
    });
}

async function viewBuilding(req, res) {
    const buildingId = req.params.buildingId;

    const canBrowse = res.locals.isLoggedIn || !res.locals.website.isAuthenticationRequiredToBrowse;
    if (!canBrowse) {
        return res.redirect('/login?continueTo=/buildings/' + buildingId);
    }

    const apiAuth = res.locals.isLoggedIn ? api.asUser(req) : api.asIntegration();

    const buildingResponse = await apiAuth.get('/buildings/' + buildingId + '?includeTickets=1');
    res.locals.ensureIsCorrectAccount(buildingResponse.json.account);

    const building = buildingResponse.json.building;
    const tickets = buildingResponse.json.tickets.map(row => row.ticket);

    const view = building.status === 'ACTIVE' ? 'building' : 'inactive-building';
    res.render(view, {
        mainNavActiveTab: 'report',
        building,
        tickets,
    });
}

async function viewLocation(req, res) {
    const locationId = req.params.locationId;

    const canBrowse = res.locals.isLoggedIn || !res.locals.website.isAuthenticationRequiredToBrowse;
    if (!canBrowse) {
        return res.redirect('/login?continueTo=/locations/' + locationId);
    }

    const apiAuth = res.locals.isLoggedIn ? api.asUser(req) : api.asIntegration();

    const locationResponse = await apiAuth.get('/locations/' + locationId + '?includeTickets=1');
    res.locals.ensureIsCorrectAccount(locationResponse.json.account);

    const location = locationResponse.json.location;
    const building = locationResponse.json.building;
    const tickets = locationResponse.json.tickets.map(row => row.ticket);

    const view = location.status === 'ACTIVE' ? 'location' : 'inactive-location';
    res.render(view, {
        mainNavActiveTab: 'report',
        location,
        building,
        tickets,
    });
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

async function viewRegister(req, res) {
    const continueTo = req.query.continueTo;

    if (res.locals.isLoggedIn) {
        return res.redirect(continueTo ? continueTo : '/');
    }

    res.render('register', {
        mainNavActiveTab: 'other',
        continueTo,
    });
}

async function viewMyAccount(req, res) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login?continueTo=/my-account');
    }

    res.render('my-account', {
        mainNavActiveTab: 'my-account',
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

async function viewResetPassword(req, res) {
    if (res.locals.isLoggedIn) {
        return res.redirect('/');
    }

    res.render('reset-password', {
        mainNavActiveTab: 'other',
        userId: req.query.userId,
        changePasswordToken: req.query.changePasswordToken,
    });
}

async function doCheckCode(req, res) {
    const code = req.query.code;

    const apiResponse = await api.asIntegration().get('/tags/' + code);
    if (apiResponse.statusCode !== 200) {
        throw new Error(`Code "${code}" is invalid`);
    }

    res.locals.ensureIsCorrectAccount(apiResponse.json.account);

    res.json({
        tag: apiResponse.json.tag,
        location: apiResponse.json.location,
        building: apiResponse.json.building,
        account: apiResponse.json.account,
        buildingOptions: apiResponse.json.buildingOptions,
    });
}

async function doLogin(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        res.status(401).json({});
        return;
    }

    try {
        const loginResponse = await api.asIntegration().post('/authentication/login', {email, password});
        console.log('Logged in', {email});
        setAuthTokenCookie(res, loginResponse.json.authenticationToken);
        res.json({user: loginResponse.json.user});
    } catch (error) {
        console.log('Failed to login', {error, email});
        res.status(401).json({});
    }
}

async function doRegister(req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    if (!email || !password || !name) {
        res.status(422).json({});
        return;
    }

    try {
        const registerResponse = await api.asIntegration().post('/authentication/register', {email, password, name});
        console.log('Registered', {email, name});
        setAuthTokenCookie(res, registerResponse.json.authenticationToken);
        res.json({});
    } catch (error) {
        console.log('Failed to register', {error, email, name});

        res.status(422).json({
            isUserAlreadyExistsError: !!error.json.isUserAlreadyExistsError,
        });
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
        await api.asIntegration().post('/authentication/request-password-reset', {email, reportingWebsite: res.locals.website.id});
        console.log('Requested password reset for ' + email);
        res.json({});
    } catch (error) {
        console.error('Failed to request password reset', {email, error});
        res.status(422).json({
            isInvalidEmail: hasHttpStatus(error, 404),
        });
    }
}

async function doResetPassword(req, res) {
    const newPassword = req.body.newPassword;
    const userId = req.body.userId;
    const changePasswordToken = req.body.changePasswordToken;

    try {
        const resetResponse = await api.asIntegration().post('/authentication/set-password', {newPassword, userId, changePasswordToken});
        console.log('Reset password', {userId});
        setAuthTokenCookie(res, resetResponse.json.authenticationToken);
        res.json({});
    } catch (error) {
        console.error('Failed to reset password', {userId, changePasswordToken, error});
        res.status(422).json({
            isNewPasswordTooShort: containsErrorCode(error, 'Size.newPassword'),
        });
    }
}

function setAuthTokenCookie(res, token) {
    if (!token) {
        throw new Error('No token given');
    }

    const ONE_DAY_IN_MS = 86400000;
    res.cookie('authToken', token, {maxAge: ONE_DAY_IN_MS * 365});
}

async function doLogOut(req, res) {
    res.clearCookie('authToken');
    res.redirect(301, '/');
}

async function viewBuildingOptions(req, res) {
    const ids = req.query.ids.split(/,/);
    const buildingPromises = ids.map(async (id) => await api.asIntegration().get('/buildings/' + id));
    const buildings = (await Promise.all(buildingPromises))
        .map(response => {
            res.locals.ensureIsCorrectAccount(response.json.account);
            return response.json.building;
        })
        .filter(building => building.status === 'ACTIVE')
        .sort((a, b) => a.name.localeCompare(b.name));

    res.render('multiple-building-options', {
        mainNavActiveTab: 'report',
        buildings,
    });
}

async function viewAccountTicketsOptions(req, res) {
    const canBrowse = res.locals.isLoggedIn || !res.locals.website.isAuthenticationRequiredToBrowse;
    if (!canBrowse) {
        return res.redirect('/login?continueTo=/account-tickets');
    }

    const apiAuth = res.locals.isLoggedIn ? api.asUser(req) : api.asIntegration();
    const accountResponse = await apiAuth.get('/accounts/' + res.locals.account.id + '?includeTickets=1')
    if (accountResponse.statusCode !== 200) {
        throw new Error(`Could not get tickets for ${res.locals.account.name}`);
    }

    const tickets = accountResponse.json.tickets
        .map(result => {
            const ticket = result.ticket;
            ticket.building = result.building;
            ticket.location = result.location;
            ticket.faultCategory = result.faultCategory;
            ticket.images = result.images;
            return ticket;
        });

    res.render('account-tickets', {
        mainNavActiveTab: 'report',
        tickets,
    });
}

module.exports = {
    viewIndex,
    viewBuilding,
    viewLocation,
    viewLogin,
    viewRegister,
    viewMyAccount,
    viewOther,
    viewPrivacy,
    viewDebugInfo,
    viewForgotPassword,
    viewResetPassword,
    viewBuildingOptions,
    viewAccountTicketsOptions,
    doCheckCode,
    doLogin,
    doRegister,
    doUpdatePersonalDetails,
    doChangePassword,
    doRequestPasswordReset,
    doResetPassword,
    doLogOut,
};

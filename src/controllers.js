const api = require('./services/api');
const resize = require('./services/resize');
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
        return res.redirect('/log-in?continueTo=/buildings/' + buildingId);
    }

    const apiAuth = res.locals.isLoggedIn ? api.asUser(req) : api.asIntegration();

    const buildingResponse = await apiAuth.get('/buildings/' + buildingId + '?includeTickets=1');
    res.locals.ensureIsCorrectAccount(buildingResponse.json.account);

    const building = buildingResponse.json.building;
    const tickets = buildingResponse.json.tickets.map(row => {
        const ticket = row.ticket;
        ticket.faultCategory = row.faultCategory;
        ticket.images = row.images;
        return ticket;
    });

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
        return res.redirect('/log-in?continueTo=/locations/' + locationId);
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

async function viewLogIn(req, res) {
    const continueTo = req.query.continueTo;

    if (res.locals.isLoggedIn) {
        return res.redirect(continueTo ? continueTo : '/');
    }

    const email = req.query.email;

    res.render('log-in', {
        mainNavActiveTab: null,
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
        mainNavActiveTab: null,
        continueTo,
    });
}

async function viewMyAccount(req, res) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/log-in?continueTo=/my-account');
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
        return res.redirect('/log-in?continueTo=/debug-info');
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
        mainNavActiveTab: null,
    });
}

async function viewResetPassword(req, res) {
    if (res.locals.isLoggedIn) {
        return res.redirect('/');
    }

    res.render('reset-password', {
        mainNavActiveTab: null,
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

async function doLogIn(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        res.status(401).json({});
        return;
    }

    try {
        const logInResponse = await api.asIntegration().post('/authentication/login', {email, password});
        console.log('Logged in', {email});
        setAuthTokenCookie(res, logInResponse.json.authenticationToken);
        res.json({user: logInResponse.json.user});
    } catch (error) {
        console.log('Failed to log in', {error, email});
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
    res.redirect(302, '/');
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
        return res.redirect('/log-in?continueTo=/account-tickets');
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

const PROGRESS_BAR_IMAGES_SOURCES = {
    NEW: '/images/progress-bar-NEW.svg',
    IN_PROGRESS: '/images/progress-bar-IN_PROGRESS.svg',
    CLOSED: '/images/progress-bar-CLOSED.svg',
};

async function viewTicket(req, res) {
    const id = req.params.ticketId;
    const canBrowse = res.locals.isLoggedIn || !res.locals.website.isAuthenticationRequiredToBrowse;
    if (!canBrowse) {
        return res.redirect('/log-in?continueTo=/tickets/' + id);
    }

    const apiAuth = res.locals.isLoggedIn ? api.asUser(req) : api.asIntegration();
    const ticketResponse = await apiAuth.get('/tickets/' + id)
    if (ticketResponse.statusCode !== 200) {
        throw new Error(`Could not get ticket ${id}`);
    }

    res.locals.ensureIsCorrectAccount(ticketResponse.json.account);

    const ticket = ticketResponse.json.ticket;
    const faultCategory = ticketResponse.json.faultCategory;
    const images = ticketResponse.json.images;
    const building = ticketResponse.json.building;
    const location = ticketResponse.json.location;
    const updates = ticketResponse.json.updates;

    let locationText = location ? location.name : ticket.locationDescription;
    if (building) {
        if (locationText) {
            locationText += ', ' + building.name;
        } else {
            locationText = building.name;
        }
    }

    let locationLink;
    if (building) {
        locationLink = '/buildings/' + building.id;
    }

    const progressBarPath = PROGRESS_BAR_IMAGES_SOURCES[ticket.status];

    res.render('ticket', {
        mainNavActiveTab: 'report',
        ticket,
        faultCategory,
        images,
        building,
        location,
        updates,
        locationText,
        locationLink,
        additionalQuestionAnswers: ticketResponse.json.ticket.additionalQuestionAnswers ? ticketResponse.json.ticket.additionalQuestionAnswers : [],
        progressBarPath,
        isStatusEnabled: ticketResponse.json.isStatusEnabled,
        areCommentsEnabled: ticketResponse.json.areCommentsEnabled,
        isSubscribedToUpdates: ticketResponse.json.isActiveUserSubscribedToUpdates,
        isOwnTicket: ticketResponse.json.isActiveUserReporter,
        canBeReopened: ticketResponse.json.canBeReopened,
    });
}

async function viewReport(req, res) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/log-in?continueTo=' + req.url);
    }

    let optionsUrl = '/new-ticket-options?',
        building,
        location,
        againstAccount;
    if (req.query.building) {
        optionsUrl += '&building=' + req.query.building;
        const buildingResponse = await api.asIntegration().get('/buildings/' + req.query.building);
        if (buildingResponse.statusCode !== 200) {
            throw new Error('Could not get building ' + req.query.building);
        }
        res.locals.ensureIsCorrectAccount(buildingResponse.json.account);
        building = buildingResponse.json.building;
        againstAccount = false;
    } else if (req.query.location) {
        optionsUrl += '&location=' + req.query.location;
        const locationResponse = await api.asIntegration().get('/locations/' + req.query.location);
        if (locationResponse.statusCode !== 200) {
            throw new Error('Could not get location ' + req.query.location);
        }
        res.locals.ensureIsCorrectAccount(locationResponse.json.account);
        location = locationResponse.json.location;
        againstAccount = false;
    } else if (req.query.againstAccount === '1') {
        optionsUrl += '&account=' + res.locals.account.id;
        againstAccount = true;
    } else {
        throw new Error('No building or location ID given');
    }

    const response = await api.asUser(req).get(optionsUrl);
    if (response.statusCode !== 200) {
        throw new Error('Could not get new ticket options from ' + optionsUrl);
    }

    const locationDescriptionLabel = response.json.locationDescriptionLabel
        ? response.json.locationDescriptionLabel
        : 'Where Is The Fault?';
    const locationDescriptionPlaceholder = response.json.locationDescriptionPlaceholder
        ? response.json.locationDescriptionPlaceholder
        : 'For example \'Flat 34\' or \'Stairwell B\'...';

    res.render('report', {
        mainNavActiveTab: 'report',
        building,
        location,
        againstAccount,
        buildingOptions: response.json.buildingOptions,
        locationOptions: response.json.locationOptions,
        faultCategoryOptions: response.json.faultCategoryOptions,
        additionalQuestions: response.json.additionalQuestions,
        promptForTicketPrivacy: !!response.json.promptForTicketPrivacy,
        promptForLocationDescription: !!response.json.promptForLocationDescription,
        locationDescriptionLabel,
        locationDescriptionPlaceholder,
    });
}

async function viewMyTickets(req, res) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/log-in?continueTo=' + req.url);
    }

    const response = await api.asUser(req).get('/tickets/own-reported');
    if (response.statusCode !== 200) {
        throw new Error('Could not get user\'s tickets');
    }

    const tickets = response.json.results
        .map(result => {
            const ticket = result.ticket;
            ticket.faultCategory = result.faultCategory;
            ticket.location = result.location;
            ticket.building = result.building;
            ticket.images = result.images;
            ticket.updates = result.updates;
            ticket.account = result.account;
            return ticket;
        })
        .filter(ticket => ticket.account.id === res.locals.account.id);

    res.render('my-tickets', {
        mainNavActiveTab: 'tickets',
        tickets,
    });
}

async function viewManifest(req, res) {
    const icons = [];
    if (res.locals.favicon) {
        const sizes = [16, 32, 192, 512];
        for (let size of sizes) {
            icons.push({
                src: '/favicon.png?width=' + size + '&height=' + size,
                type: 'image/png',
                sizes: size + 'x' + size,
            });
        }
    }

    res.json({
        name: res.locals.website.name,
        short_name: res.locals.website.name,
        icons,
        start_url: '/?source=pwa',
        background_color: res.locals.account.primaryColorHex,
        display: 'standalone',
        scope: '/',
        theme_color: res.locals.account.primaryColorHex,
        gcm_sender_id: '103953800507',
    });
}

async function viewFavicon(req, res) {
    if (!res.locals.favicon) {
        console.warn('No favicon for ' + res.locals.website.name);
        return res.status(404).send();
    }

    const width = parseInt(req.query.width);
    const height = parseInt(req.query.height);
    const url = res.locals.favicon.compressedUrl;

    res.type(`image/png`);
    const resized = await resize(url, width, height, 'png');
    resized.pipe(res);
}

module.exports = {
    viewIndex,
    viewBuilding,
    viewLocation,
    viewLogIn,
    viewRegister,
    viewMyAccount,
    viewOther,
    viewPrivacy,
    viewDebugInfo,
    viewForgotPassword,
    viewResetPassword,
    viewBuildingOptions,
    viewAccountTicketsOptions,
    viewTicket,
    viewReport,
    viewMyTickets,
    viewManifest,
    viewFavicon,
    doCheckCode,
    doLogIn,
    doRegister,
    doUpdatePersonalDetails,
    doChangePassword,
    doRequestPasswordReset,
    doResetPassword,
    doLogOut,
};

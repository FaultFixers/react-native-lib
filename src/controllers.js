const api = require('./services/api');
const {getTag} = require('./services/tags');
const {getActiveBuildings, getActiveBuildingById} = require('./services/buildings');

function getErrorCodes(response) {
    const codes = [];
    if (response.json && response.json.errors) {
        for (let i = 0; i < response.json.errors.length; i++) {
            const error = response.json.errors[i];
            console.log('error', error);
            if (error.codes) {
                for (let ii = 0; ii < error.codes.length; ii++) {
                    codes.push(error.codes[ii]);
                }
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
    if (res.locals.isLoggedIn) {
        res.redirect('/');
    } else {
        res.render('login', {
            mainNavActiveTab: 'other',
        });
    }
}

async function viewAccount(req, res) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login?continue=/account');
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
    doCheckCode,
    doLogin,
    doUpdatePersonalDetails,
    doChangePassword,
    doLogOut,
};

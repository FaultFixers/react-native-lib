const api = require('../services/api');
const faultfixersLib = require('faultfixers-js-lib');

const DEFAULT_BRANDING = {
    primaryColorHex: faultfixersLib.coreColors.blue,
    textOverPrimaryColorHex: '#ffffff',
    highlightColorHex: faultfixersLib.coreColors.pink,
    textOverHighlightColorHex: '#ffffff',
    reporterAppBottomNavActiveColorHex: faultfixersLib.coreColors.blue,
};

function addMissingBranding(account) {
    if (!account.hasCustomAppColors) {
        for (const key in DEFAULT_BRANDING) {
            account[key] = DEFAULT_BRANDING[key];
        }
    }
}

async function getActiveWebsite(req) {
    const domain = req.hostname;
    const response = await api.asIntegration().get('/reporting-websites/' + domain);
    if (response.statusCode !== 200) {
        throw new Error('Could not get website details for: ' + domain);
    }

    const json = response.json;

    if (json.reportingWebsite.status !== 'ACTIVE') {
        throw new Error('The website ' + domain + ' is not active');
    }
    if (json.account.status !== 'ACTIVE') {
        throw new Error('Sorry - the ' + json.account.name
            + ' portal is no longer active. Please get in touch with your account manager or hello@faultfixers.com if you believe this is incorrect.');
    }

    addMissingBranding(json.account);

    return json;
}

async function loadWebsiteByDomain(req, res, next) {
    let response;
    try {
        response = await getActiveWebsite(req);
    } catch (e) {
        return next(e);
    }

    if (!req.locals) {
        req.locals = {};
    }
    req.locals.account = response.account;

    res.locals.website = response.reportingWebsite;
    res.locals.account = response.account;
    res.locals.favicon = response.favicon;

    if (response.rectangleLogo) {
        res.locals.logo = response.rectangleLogo;
    } else if (response.squareLogo) {
        res.locals.logo = response.squareLogo;
    } else {
        return next(new Error('No logo has been added for this account/webiste'));
    }

    res.locals.ensureIsCorrectAccount = function ensureIsCorrectAccount(otherAccount) {
        if (!otherAccount) {
            throw new Error('Not given an account');
        }

        if (otherAccount.id !== response.account.id) {
            throw new Error('The data given is not for ' + req.hostname);
        }
    };

    res.locals.isRequestQuoteEnabled = !!res.locals.website.isRequestQuoteEnabled;

    console.log('Account for ' + res.locals.website.domain + ' is ' + res.locals.account.name);

    next();
}

module.exports = loadWebsiteByDomain;

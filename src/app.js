const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const lessMiddleware = require('less-middleware');
const logger = require('morgan');
const moment = require('moment');
const router = require('./router');
const {
    formatQuestionLabel,
    formatTicketPriority,
    formatTicketUpdateNewDueRange,
    paragraphs,
} = require('faultfixers-js-lib');
const config = require('../config/load');
const loadWebsiteByDomain = require('./middlewares/load-website-by-domain');
const loadUserByCookie = require('./middlewares/load-user-by-cookie');
const api = require('./services/api');
const ticketUpdates = require('./services/ticket-updates');

console.debug('Config:', config);

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('x-powered-by', false);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(loadWebsiteByDomain);
app.use(lessMiddleware(
    path.join(__dirname, 'public'),
    {
        force: true,
        preprocess: {
            less: function(less, req) {
                if (!req.locals || !req.locals.account) {
                    throw new Error('Account not in request');
                }

                const account = req.locals.account;
                const colors = `
                    @primaryColor: ${account.primaryColorHex};
                    @textOverPrimaryColor: ${account.textOverPrimaryColorHex};
                    @highlightColor: ${account.highlightColorHex};
                    @textOverHighlightColor: ${account.textOverHighlightColorHex};
                    @reporterAppBottomNavActiveColor: ${account.reporterAppBottomNavActiveColorHex};
                `;
                return colors + '\n' + less;
            },
        },
    }
));
app.use(express.static(path.join(__dirname, 'public')));
app.use(loadUserByCookie);
app.use((req, res, next) => {
    res.locals.cookies = req.cookies;
    res.locals.API_VERSION = api.API_VERSION;
    next();
});

app.use('/', router);

app.locals.config = config;
app.locals.paragraphs = paragraphs;
app.locals.moment = moment;
app.locals.formatDateTime = date => moment(date).format('D MMM YYYY, h:mma');
app.locals.formatTicketPriority = formatTicketPriority;
app.locals.formatQuestionLabel = formatQuestionLabel;
app.locals.formatTicketUpdateNewDueRange = formatTicketUpdateNewDueRange;
app.locals.getUpdateTitle = ticketUpdates.getUpdateTitle;
app.locals.getUpdateIcon = ticketUpdates.getUpdateIcon;
app.locals.getUpdateUpdaterDescription = ticketUpdates.getUpdateUpdaterDescription;
app.locals.getUpdateCommentVisibility = ticketUpdates.getUpdateCommentVisibility;
app.locals.getCurrentYear = function() {
    return moment().format('YYYY');
};

// Catch 404 and forward to error handler.
app.use(function(req, res, next) {
    next(createError(404));
});

// Error handler.
app.use(function(err, req, res, next) { // eslint-disable-line no-unused-vars
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // Render the error page.
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

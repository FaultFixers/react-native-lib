const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const lessMiddleware = require('less-middleware');
const logger = require('morgan');
const moment = require('moment');
const fs = require('fs');
const {promisify} = require('util');
const router = require('./router');
const {
    formatLocalDateTime,
    formatQuestionLabel,
    formatTicketPriority,
    getShortUserDescription,
    paragraphs,
} = require('faultfixers-js-lib');
const config = require('../config/load');
const loadWebsiteByDomain = require('./middlewares/load-website-by-domain');
const loadUserByCookie = require('./middlewares/load-user-by-cookie');

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
    next();
});

const readFile = promisify(fs.readFile);

async function sendConcatOfFiles(res, files) {
    let readPromises = files.map(async (file) => {
        if (typeof file === 'string') {
            return await readFile('./' + file, 'utf8');
        } else if (typeof file === 'function') {
            return file();
        } else {
            throw new Error('Unexpected type: ' + file);
        }
    });
    readPromises = (await Promise.all(readPromises));
    const concat = readPromises.join('\n');
    res.type('.js').send(concat);
}

app.use('/', router);

app.use('/js/all.js', async (req, res) => {
    res.set('Cache-Control', 'public, max-age=86400');
    sendConcatOfFiles(res, [
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/jquery-modal/jquery.modal.min.js',
        async function() {
            let content = await readFile('node_modules/bson-objectid/objectid.js', 'utf8');
            content = content.replace('module.exports = ObjectID;', 'window.ObjectID = ObjectID;');
            return content;
        },
        'src/public/js/device-session-id.js',
        'src/public/js/http.js',
        'src/public/js/Logger.js',
        'src/public/js/main.js',
    ]);
});

app.locals.config = config;
app.locals.paragraphs = paragraphs;
app.locals.moment = moment;
app.locals.formatDateTime = date => moment(date).format('D MMM YYYY, h:mma');
app.locals.formatLocalDateTime = formatLocalDateTime;
app.locals.formatTicketPriority = formatTicketPriority;
app.locals.formatQuestionLabel = formatQuestionLabel;
app.locals.getUpdateTitle = update => {
    if (update.hasStatusChanged) {
        switch (update.newStatus) {
        case 'NEW':
            return 'Ticket opened';
        case 'IN_PROGRESS':
            return (update.oldStatus === 'CLOSED' ? 'Re-opened' : 'Resolution in progress');
        case 'CLOSED':
            return 'Resolved';
        }
    }
    if (update.hasComment) {
        return 'Comment';
    }
    if (update.hasInternalAction) {
        switch (update.internalActionType) {
        case 'ADD_IMAGE':
            return 'Image added';
        case 'CHECK_IN':
            return 'Checked in';
        case 'CHECK_OUT':
            return 'Checked out';
        case 'RECORD_EXPENSE':
            return 'Expense recorded';
        case 'RECORD_TRAVEL_MILEAGE':
            return 'Travel mileage recorded';
        }
    }
    if (update.hasAssigneeChanged) {
        if (update.newAssignee) {
            return `Assigned to ${getShortUserDescription(update.newAssignee)}`;
        } else {
            return `Un-assigned from ${getShortUserDescription(update.oldAssignee)}`;
        }
    }
    if (update.hasDueDateOrTimeChanged) {
        if (update.hasDueDateChanged && update.hasDueTimeChanged) {
            return 'Due date & time set';
        } else if (update.hasDueDateChanged) {
            return 'Due date set';
        } else if (update.hasDueTimeChanged) {
            return 'Due time set';
        }
    }
    if (update.hasPriorityChanged) {
        return 'Priority set';
    }
    return null;
};
app.locals.getUpdateIcon = update => {
    if (update.hasStatusChanged) {
        if (update.newStatus === 'NEW') {
            return 'ff-ticket-opened-circled';
        } else if (update.newStatus === 'IN_PROGRESS') {
            if (update.oldStatus === 'CLOSED') {
                return 'ff-ticket-reopened-circled';
            } else {
                return 'ff-ticket-in-progress-circled';
            }
        } else if (update.newStatus === 'CLOSED') {
            return 'ff-ticket-closed-circled';
        }
    }
    if (update.hasComment) {
        return 'ff-ticket-comment-circled';
    }
    if (update.hasInternalAction) {
        switch (update.internalActionType) {
        case 'ADD_IMAGE':
            return 'ff-camera-circled';
        case 'CHECK_IN':
            return 'ff-check-in-circled';
        case 'CHECK_OUT':
            return 'ff-check-out-circled';
        case 'RECORD_EXPENSE':
            return 'ff-expense-circled';
        case 'RECORD_TRAVEL_MILEAGE':
            return 'ff-mileage-circled';
        }
    }
    if (update.hasAssigneeChanged) {
        if (update.newAssignee) {
            return 'ff-ticket-assigned-circled';
        } else {
            return 'ff-ticket-unassigned-circled';
        }
    }
    if (update.hasDueDateOrTimeChanged) {
        return 'ff-due-date-time-circled';
    }
    if (update.hasPriorityChanged) {
        return 'ff-priority-circled';
    }

    return null;
};
app.locals.getUpdateUpdaterDescription = (update, isOwnTicket) => {
    if (update.isByReporter && isOwnTicket) {
        return 'you';
    } else if (update.isByReporter) {
        return 'the reporter';
    } else if (update.isByFacilityManager) {
        return 'the repairs team';
    }
    return null;
};
app.locals.getUpdateCommentVisibility = update => {
    switch (update.commentVisibility) {
    case 'PUBLIC':
        return 'Public comment';
    case 'PRIVATE_TO_REPORTER':
        return 'Private comment';
    case 'INTERNAL_TO_TEAM':
        return 'Internal comment';
    }
    return null;
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

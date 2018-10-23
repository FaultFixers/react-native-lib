const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const lessMiddleware = require('less-middleware');
const logger = require('morgan');
const router = require('./router');
const {paragraphs} = require('faultfixers-js-lib');
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
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(loadWebsiteByDomain);
app.use(loadUserByCookie);
app.use('/', router);

app.locals.paragraphs = function(text) {
    return paragraphs(text);
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

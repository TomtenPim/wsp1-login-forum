require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const nunjucks = require('nunjucks');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;

const indexRouter = require('./routes/index');
const createError = require('http-errors');

app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: false }));


app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard pim',
  resave: false,
  saveUninitialized: true,
}));

nunjucks.configure('views', {
    autoescape: true,
    express: app,
});

app.use(function (err, req, res, next){
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error.njk')
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use(function (req, res, next) {
    next(createError(404))
});

module.exports = app;
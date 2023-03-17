const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const mysql = require('mysql2');
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
});
const promisePool = pool.promise();

const nav = [
    {
        url: "/",
        title: "Forum"
    },
    {
        url: "/new",
        title: "New"
    },
    {
        url: "/login",
        title: "Login"
    },
    {
        url: "/Register",
        title: "Register"
    },
    {
        url: "/error",
        title: "Error"
    },
]

router.get('/', async function (req, res) {
    const [rows] = await promisePool.query("SELECT sa04loginForum.*, sa04loginUsers.author AS name FROM sa04loginForum JOIN sa04loginUsers ON sa04loginForum.authorId = sa04loginUsers.id ORDER BY id DESC");
    res.render('index.njk', {
        rows: rows,
        title: 'Forum',
        nav: nav,
    });
});





router.get('/new', async function (req, res, next) {

    if (req.session.loggedin) {

        const [users] = await promisePool.query('SELECT * FROM sa04loginUsers');
        res.render('new.njk', {
            users,
            title: 'Nytt inlägg',
            nav: nav,
        });
    } else {
        res.redirect('/login')
    }
});

router.post('/new', async function (req, res, next) {
    const { author, title, content } = req.body;



    let [user] = await promisePool.query('SELECT * FROM sa04loginUsers WHERE name = ?', [author]);
    if (user.length === 0) {
        [user] = await promisePool.query('INSERT INTO sa04loginUsers (name) VALUES (?)', [author]);
    }

    console.log(user)
    const authorId = user.insertId || user[0].id;

    const [rows] = await promisePool.query('INSERT INTO srb26forum (authorId, title, content) VALUES (?, ?, ?)', [authorId, title, content]);
    res.redirect('/');
});

router.get('/login', function (req, res, next) {
    res.render('login.njk', { title: 'Login ALC', nav: nav });
});

router.post('/login', async function (req, res, next) {
    const { username, password } = req.body;

    if (username.length === 0) {
        res.json('Username is Required')
    }

    else if (password.length === 0) {
        res.json('Password is Required')
    }
    else {
        const [rowsname, query] = await promisePool.query('SELECT author FROM sa04loginUsers WHERE author = ?', [username]);
        console.log(rowsname);
        if (rowsname.length > 0) {
            const [rows, query] = await promisePool.query('SELECT password FROM sa04loginUsers WHERE author = ?', [username]);

            console.log(rows[0].password)

            const bcryptPassword = rows[0].password

            bcrypt.compare(password, bcryptPassword, function (err, result) {

                console.assert(result, 'Invalid username or password')

                if (result) {

                    req.session.loggedin = true;
                    req.session.username = username;

                    res.redirect('/');
                }
                else {
                    res.json('Invalid username or password')
                }
            });
        }
        else {
            res.json('Invalid username or password');
        }

    }

});


router.get('/register', function (req, res, next) {
    res.render('register.njk', { title: 'Lägg till användare', nav: nav });
});

router.post('/register', async function (req, res, next) {
    const { username, password, passwordConfirmation, } = req.body;

    if (username.length === 0) {
        res.json('Username is Required')
    }

    else if (password.length === 0) {
        res.json('Password is Required')
    }

    else if (passwordConfirmation !== password) {
        res.json('Passwords do not match')
    }

    else {
        const [user, query] = await promisePool.query('SELECT author FROM sa04loginUsers WHERE author = ?', [username]);
        if (user.length > 0) {
            res.json('Username is already taken')
        }
        else {

            bcrypt.hash(password, 10, async function (err, hash) {
                await promisePool.query('INSERT INTO sa04loginUsers (author, password) VALUES (?, ?)', [username, hash]);
                res.redirect('/login');
            });
        }
    }
});






router.get('/post/:id', async function (req, res, next) {
    const [users] = await promisePool.query('SELECT * FROM sa04loginUsers');

    const [rows] = await promisePool.query("SELECT * FROM sa04loginForum WHERE id = ?", [parseInt(req.params.id)])

    res.render('comment.njk', {
        users,
        Id: req.params.id,
        title: 'Ny komentar',
        nav: nav,
    });
});

router.post('/post/comment', async function (req, res, next) {
    const { author, content } = req.body;

    let [user] = await promisePool.query('SELECT * FROM sa04loginUsers WHERE author = ?', [author]);
    if (user.length === 0) {
        [user] = await promisePool.query('INSERT INTO sa04loginUsers (author) VALUES (?)', [author]);
    }

    const postId = Id

    console.log(user)
    const authorId = user.insertId || user[0].id;

    const [rows] = await promisePool.query('INSERT INTO sa04logincomments (authorId, content, postId) VALUES (?, ?, ?)', [authorId, content, postId]);
    res.redirect('/post/:' + postId);
});

module.exports = router;

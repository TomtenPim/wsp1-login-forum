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
let errors = [];

const nav = [ 
    {
        url: "/profile",
        title: "Profile"
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
        url: "/register",
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
            user: req.session.id,
            title: 'Nytt inlägg',
            nav: nav,
        });
    } else {
        req.session.loginOrigin = "new";
        res.redirect('/login')
    }
});

router.post('/new', async function (req, res, next) {
    const {title, content } = req.body;
    errors = [];
    if (!title){
        errors.push('Title is required');
    }
    else if (!content){
        errors.push('Content is required');
    }
    else if (title && title.length < 3){
        errors.push('Title must be at least 3 characters');
    }
    else if (content && content.length < 10){
        errors.push('Content must be at least 10 characters');
    }
    
    if (errors.length === 0) {
        // sanitize title och body, tvätta datan
        const sanitize = (str) => {
            let temp = str.trim();
            temp = validator.stripLow(temp);
            temp = validator.escape(temp);
            return temp;
        };
        if (title) {
            const sanitizedTitle = sanitize(title);
        }
        if (content) {
            const sanitizedContent = sanitize(content);
        }

        const [authorId] = await promisePool.query('SELECT id FROM sa04loginUsers WHERE author = ?', [req.session.username]);
    
        const [rows] = await promisePool.query('INSERT INTO sa04loginForum (authorId , title, content) VALUES (?, ?, ?)', [authorId[0].id, sanitizedTitle, sanitizedContent]);
        res.redirect('/');
    }
    else res.render('new.njk', {
            user: req.session.id,
            title: 'Nytt inlägg',
            nav: nav,
            err: errors,
        });
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
        if (rowsname.length > 0) {
            const [rows, query] = await promisePool.query('SELECT password FROM sa04loginUsers WHERE author = ?', [username]);

            const bcryptPassword = rows[0].password

            bcrypt.compare(password, bcryptPassword, function (err, result) {

                console.assert(result, 'Invalid username or password')

                if (result) {

                    req.session.loggedin = true;
                    req.session.username = username;


                    if (req.session.loginOrigin === "new"){
                        res.redirect('/new');
                    }
                    else{
                        res.redirect('/profile');
                    }
                    
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
    errors = []

    if (username.length === 0) {
        errors.push('Username is Required')
    }

    else if (password.length === 0) {
        errors.push('Password is Required')
    }
    
    else if (password.length < 7) {
        errors.push('Password must be at least 8 characters')
    }

    else if (passwordConfirmation !== password) {
        errors.push('Passwords do not match')
    }

    if (errors.length === 0){
        const [user, query] = await promisePool.query('SELECT author FROM sa04loginUsers WHERE author = ?', [username]);
        if (user.length > 0) {
            res.json('Username is already taken')
        }
        else {

            bcrypt.hash(password, 10, async function (err, hash) {
                await promisePool.query('INSERT INTO sa04loginUsers (author, password) VALUES (?, ?)', [username, hash]);

                req.session.loggedin = true;
                req.session.username = username;

                res.redirect('/profile');
            });
        }
    }
    
    else  res.render('register.njk', {
            user: req.session.id,
            title: 'Lägg till användare',
            nav: nav,
            err: errors,
        });
});



router.get('/profile', function(req, res, next){
    if(req.session.loggedin){
        
        res.render('profile.njk', { username: req.session.username, nav: nav,})
        
    }
    else{
        res.redirect('/login').status(401).json('Access denied')
    }
});



router.post('/logout', async function(req, res, next){
    if(req.session.loggedin){

        req.session.destroy();
        res.redirect('/')
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

const express = require('express');
const router = express.Router();

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
        title: "Home"
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
    const [rows] = await promisePool.query("SELECT sa04forum.*, sa04users.name AS name FROM sa04forum JOIN sa04users ON sa04forum.authorId = sa04users.id ORDER BY id DESC");
    res.render('index.njk', {
        rows: rows,
        title: 'Forum',
        nav: nav,
    });
});





router.get('/new', async function (req, res, next) {
    const [users] = await promisePool.query('SELECT * FROM sa04users');
    res.render('new.njk', {
        users,
        title: 'Nytt inlägg',
        nav: nav,
    });
});

router.post('/new', async function (req, res, next) {
    const { author, title, content } = req.body;

    let [user] = await promisePool.query('SELECT * FROM sa04users WHERE name = ?', [author]);
    if (user.length === 0) {
        [user] = await promisePool.query('INSERT INTO sa04users (name) VALUES (?)', [author]);
    }

    console.log(user)
    const authorId = user.insertId || user[0].id;

    const [rows] = await promisePool.query('INSERT INTO srb26forum (authorId, title, content) VALUES (?, ?, ?)', [authorId, title, content]);
    res.redirect('/');
});





router.get('/post/:id', async function (req, res, next) {
    const [users] = await promisePool.query('SELECT * FROM sa04users');

const [rows] = await promisePool.query("SELECT * FROM sa04forum WHERE id = ?", [parseInt(req.params.id)] )

    res.render('comment.njk', {
        users,
        Id: req.params.id,
        title: 'Ny komentar',
        nav: nav,
    });
});

router.post('/post/comment', async function (req, res, next) {
    const { author, content} = req.body;

    let [user] = await promisePool.query('SELECT * FROM sa04users WHERE name = ?', [author]);
    if (user.length === 0) {
        [user] = await promisePool.query('INSERT INTO sa04users (name) VALUES (?)', [author]);
    }

    const postId = Id

    console.log(user)
    const authorId = user.insertId || user[0].id;

    const [rows] = await promisePool.query('INSERT INTO sa04comments (authorId, content, postId) VALUES (?, ?, ?)', [authorId, content, postId]);
    res.redirect('/post/:' + postId);
});

module.exports = router;

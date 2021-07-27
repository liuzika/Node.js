const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    res.cookie('name', '123')
    req.session['age'] = '20'
    res.render('news/index')
})
router.get('/get_cookie', (req, res) => {
    res.send('获取到的cookie为' + req.cookies['name'])
})
router.get('/session', (req, res) => {
    res.send('session' + req.session['age'])
})

module.exports = router
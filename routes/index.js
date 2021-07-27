const express = require('express')
const hanbleDB = require('../db/handleDB')
const router = express.Router()

router.get('/', (req, res) => {
    // 测试设置cookie和session
    res.cookie('name', '123')
    req.session['age'] = '20'
    res.render('news/index')
})
router.get('/get_cookie', (req, res) => {
    // 测试获取cookie
    res.send('获取到的cookie为' + req.cookies['name'])
})
router.get('/session', (req, res) => {
    // 测试获取session
    res.send('session' + req.session['age'])
})
router.get('/get_data', (req, res) => {
    // 测试获取数据库
    (async function () {
        let result = await hanbleDB(res, 'info_category', 'find', '数据库查询出错')
        res.send(result)
    })()
})

module.exports = router
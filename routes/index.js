const express = require('express')
const hanbleDB = require('../db/handleDB')
require('../utils/filter')

const router = express.Router()

router.get('/', (req, res) => {
    (async function () {
        // 判断是否为登录状态
        let user_id = req.session['user_id']
        let result = []
        if (user_id) {
            result = await hanbleDB(res, 'info_user', 'find', '数据库查询出错', `id='${user_id}'`)
        }
        // 头部分类展示
        let result2 = await hanbleDB(res, 'info_category', 'find', '数据库查询出错', ['name'])
        // 右部点击排行展示
        // let result3 = await hanbleDB(res, 'info_news', 'sql', '数据库查询出错', 'select * from info_news order by clicks desc limit 6')
        let result3 = await hanbleDB(res, 'info_news', 'find', '数据库查询出错', '1 order by clicks desc limit 6')

        let data = {
            user_info: result[0] ? {
                nick_name: result[0].nick_name,
                avatar_url: result[0].avatar_url
            } : false,
            category: result2,
            newsClick: result3
        }
        res.render('news/index', data)
    })()
})
// router.get('/get_cookie', (req, res) => {
//     // 测试获取cookie
//     res.send('获取到的cookie为' + req.cookies['name'])
// })
// router.get('/session', (req, res) => {
//     // 测试获取session
//     res.send('session' + req.session['age'])
// })
// router.get('/get_data', (req, res) => {
//     // 测试获取数据库
//     (async function () {
//         let result = await hanbleDB(res, 'info_category', 'find', '数据库查询出错')
//         res.send(result)
//     })()
// })

module.exports = router
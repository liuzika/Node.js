const express = require('express')
const handleDB = require('../db/handleDB')
const { getUser } = require('../utils/common')
const constant = require('../utils/constant')
require('../utils/filter')

const router = express.Router()

router.get('/', (req, res) => {
    (async function () {
        // 判断是否为登录状态
        let userInfo = await getUser(req, res)

        // 头部分类展示
        let result2 = await handleDB(res, 'info_category', 'find', '数据库查询出错', ['name'])

        // 右部点击排行展示
        // let result3 = await handleDB(res, 'info_news', 'sql', '数据库查询出错', 'select * from info_news order by clicks desc limit 6')
        let result3 = await handleDB(res, 'info_news', 'find', '数据库查询出错', '1 order by clicks desc limit 6')

        let data = {
            user_info: userInfo[0] ? {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + userInfo[0].avatar_url : '/news/images/worm.jpg'
            } : false,
            category: result2,
            newsClick: result3
        }
        res.render('news/index', data)
    })()
})


router.get('/news_list', (req, res) => {
    (async function () {
        let { page = 1, cid = 1, per_page = 5 } = req.query
        let wh = cid === '1' ? '1' : `category_id="${cid}"`
        let result = await handleDB(res, 'info_news', 'limit', '数据库查询出错', {
            where: `${wh} order by create_time desc`,
            number: page,
            count: per_page
        })
        let result2 = await handleDB(res, 'info_news', 'sql', '数据库查询出错', 'select count(*) from info_news where ' + wh)
        let totalPage = Math.ceil(result2[0]['count(*)'] / per_page)
        res.send({
            newsList: result,
            totalPage,
            currentPage: Number(page)
        })
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
//         let result = await handleDB(res, 'info_category', 'find', '数据库查询出错')
//         res.send(result)
//     })()
// })

module.exports = router
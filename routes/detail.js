const express = require('express')
const handleDB = require('../db/handleDB')
const { getUser, abort404 } = require('../utils/common')
require('../utils/filter')

const router = express.Router()

// 新闻详情页请求
router.get('/news_detail/:news_id', (req, res) => {
    (async function () {

        // 登录状态
        let userInfo = await getUser(req, res)

        // 右侧点击排行
        let result3 = await handleDB(res, 'info_news', 'find', '数据库查询出错', '1 order by clicks desc limit 6')

        // 新闻内容展示
        let { news_id } = req.params
        let newsResult = await handleDB(res, 'info_news', 'find', '数据库查询出错', `id=${news_id}`)

        if (!newsResult[0]) {
            abort404(req, res)
            return
        }

        // 点击数修改
        newsResult[0].clicks += 1
        await handleDB(res, 'info_news', 'update', '数据库修改出错', `id=${news_id}`, { clicks: newsResult[0].clicks })

        // 是否收藏
        let isCollection = false // 默认没有收藏
        if (userInfo[0]) {
            let collectionResult = await handleDB(res, 'info_user_collection', 'find', '数据库查询出错', `user_id=${userInfo[0].id} and news_id=${news_id}`)
            if (collectionResult[0]) {
                isCollection = true
            }
        }

        let data = {
            user_info: userInfo[0] ? {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url
            } : false,
            newsClick: result3,
            newsData: newsResult[0],
            isCollection
        }
        res.render('news/detail', data)
    })()
})

// 收藏操作请求
router.post('/news_detail/news_collect', (req, res) => {
    (async function () {
        let userInfo = await getUser(req, res)

        if (!userInfo[0]) {
            // 用户未登录
            res.send({
                errno: '4101',
                errmsg: '未登录'
            })
            return
        }

        // 前端传递的参数非空
        let { news_id, action } = req.body
        if (!news_id || !action) {
            res.send({ errmsg: '参数错误01' })
            return
        }

        // 对应id的数据是否存在
        let newsResult = await handleDB(res, 'info_news', 'find', '数据库查询错误', `id=${news_id}`)
        if (!newsResult[0]) {
            res.send({ errmsg: '参数错误02' })
            return
        }

        // 收藏和取消收藏
        if (action === 'collect') {
            await handleDB(res, 'info_user_collection', 'insert', '数据库添加出错', {
                user_id: userInfo[0].id,
                news_id
            })
        } else {
            await handleDB(res, 'info_user_collection', 'delete', '数据库删除出错', `user_id=${userInfo[0].id} and news_id=${news_id}`)
        }
        res.send({
            errno: '0',
            errmsg: '操作成功'
        })

    })()
})

module.exports = router
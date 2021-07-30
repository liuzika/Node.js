const express = require('express')
const handleDB = require('../db/handleDB')
const { dateTime, getUser, abort404 } = require('../utils/common')
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

        // 渲染评论信息
        let commentResult = await handleDB(res, 'info_comment', 'find', '数据库查询出错', `news_id=${news_id} order by create_time desc`)
        for (let i = 0; i < commentResult.length; i++) {
            let commenterResult = await handleDB(res, 'info_user', 'find', '数据库查询出错', `id=${commentResult[i].user_id}`)
            commentResult[i].commenter = {
                nick_name: commenterResult[0].nick_name,
                avatar_url: commenterResult[0].avatar_url ? commenterResult[0].avatar_url : '/news/images/worm.jpg'
            }
            // 判断有无父评论
            if (commentResult[i].parent_id) {
                var parentComment = await handleDB(res, 'info_comment', 'find', '数据库查询出错', `id=${commentResult[i].parent_id}`)
                var parentUserInfo = await handleDB(res, 'info_user', 'find', '数据库查询出错', `id=${parentComment[0].user_id}`)
                commentResult[i].parent = {
                    user: {
                        nick_name: parentUserInfo[0].nick_name
                    },
                    content: parentComment[0].content
                }
            }
        }

        // 渲染点赞信息
        let user_like_comment_ids = []
        if (userInfo[0]) {
            let user_like_commentsResult = await handleDB(res, 'info_comment_like', 'find', '数据库查询出错', `user_id=${userInfo[0].id}`)
            user_like_commentsResult.forEach(item => {
                user_like_comment_ids.push(item.comment_id)
            })
        }

        // 传给前端的数据
        let data = {
            user_info: userInfo[0] ? {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url ? userInfo[0].avatar_url : '/news/images/worm.jpg'
            } : false,
            newsClick: result3,
            newsData: newsResult[0],
            isCollection,
            commentList: commentResult,
            user_like_comment_ids
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

// 评论功能实现
router.post('/news_detail/news_comment', (req, res) => {
    (async function () {
        // 用户登录状态
        let userInfo = await getUser(req, res)
        if (!userInfo[0]) {
            res.send({ errno: '4101', errmsg: '未登录' })
            return
        }

        // 前端传递的参数非空
        let { news_id, comment, parent_id = null } = req.body
        if (!news_id || !comment) {
            res.send({ errmsg: '参数错误01' })
            return
        }

        // 对应id的数据是否存在
        let newsResult = await handleDB(res, 'info_news', 'find', '数据库查询错误', `id=${news_id}`)
        if (!newsResult[0]) {
            res.send({ errmsg: '参数错误02' })
            return
        }

        // 往数据库添加评论数据
        let commentObj = {
            user_id: userInfo[0].id,
            news_id,
            content: comment,
            create_time: dateTime(new Date())
        }

        if (parent_id) {
            commentObj.parent_id = parent_id

            var parentComment = await handleDB(res, 'info_comment', 'find', '数据库查询出错', `id=${parent_id}`)
            var parentUserInfo = await handleDB(res, 'info_user', 'find', '数据库查询出错', `id=${parentComment[0].user_id}`)

        }

        let insertResult = await handleDB(res, 'info_comment', 'insert', '数据库插入出错', commentObj)

        res.send({
            errno: '0',
            data: {
                user: {
                    avatar_url: userInfo[0].avatar_url ? userInfo[0].avatar_url : '/news/images/worm.jpg',
                    nick_name: userInfo[0].nick_name
                },
                content: comment,
                create_time: commentObj.create_time,
                id: insertResult.insertId,
                parent: parent_id ? {
                    user: {
                        nick_name: parentUserInfo[0].nick_name
                    },
                    content: parentComment[0].content
                } : null
            },
            errmsg: '评论成功'
        })
    })()
})

// 点赞功能实现
router.post('/news_detail/comment_like', (req, res) => {
    (async function () {
        // 用户登录状态
        let userInfo = await getUser(req, res)
        if (!userInfo[0]) {
            res.send({ errno: '4101', errmsg: '未登录' })
            return
        }

        // 前端传递的参数非空
        let { comment_id, action } = req.body
        if (!comment_id || !action) {
            res.send({ errmsg: '参数错误01' })
            return
        }

        // 对应id的数据是否存在
        let commentResult = await handleDB(res, 'info_comment', 'find', '数据库查询错误', `id=${comment_id}`)
        if (!commentResult[0]) {
            res.send({ errmsg: '参数错误02' })
            return
        }

        // 点赞和取消点赞
        let like_count
        if (action === 'add') {
            // 点赞评论
            await handleDB(res, 'info_comment_like', 'insert', '数据库添加错误', { comment_id, user_id: userInfo[0].id })
            like_count = commentResult[0].like_count ? commentResult[0].like_count + 1 : 1
        } else {
            // 取消点赞
            await handleDB(res, 'info_comment_like', 'delete', '数据库删除错误', `comment_id=${comment_id} and user_id=${userInfo[0].id}`)
            like_count = commentResult[0].like_count ? commentResult[0].like_count - 1 : 0
        }

        await handleDB(res, 'info_comment', 'update', '数据库更新错误', `id=${comment_id}`, { like_count })

        res.send({
            errno: '0',
            errmsg: '操作成功'
        })

    })()
})

module.exports = router
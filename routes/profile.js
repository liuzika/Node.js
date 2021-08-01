const express = require('express')
const md5 = require('md5')
const keys = require('../keys')
const handleDB = require('../db/handleDB')
const { getUserInfo } = require('../utils/common')
const multer = require('multer')
const upload_file = require('../utils/qn')
const constant = require('../utils/constant')

const upload = multer({ dest: 'public/news/upload/avatar' })
const router = express.Router()

router.get('/profile', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)

        let data = {
            user_info: {
                nick_name: userInfo[0].nick_name,
                avatar_url: userInfo[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + userInfo[0].avatar_url : '/news/images/worm.jpg'
            }
        }
        res.render('news/user', data)
    })()
})

// 基本资料修改
router.all('/user/base_info', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)

        if (req.method === 'GET') {
            let data = {
                nick_name: userInfo[0].nick_name,
                signature: userInfo[0].signature,
                gender: userInfo[0].gender ? userInfo[0].gender : 'MAN'
            }
            res.render('news/user_base_info', data)
        } else if (req.method === 'POST') {
            // 前端传递的参数非空
            let { signature, nick_name, gender } = req.body
            if (!signature || !nick_name || !gender) {
                res.send({ errmsg: '缺少必要参数' })
                return
            }

            // 修改数据库
            await handleDB(res, 'info_user', 'update', '数据库更新错误', `id=${userInfo[0].id}`, { signature, nick_name, gender })
            res.send({ errno: '0', errmsg: '操作成功' })
        }
    })()
})

// 密码修改
router.all('/user/pass_info', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)

        if (req.method === 'GET') {
            res.render('news/user_pass_info')
        } else if (req.method === 'POST') {
            let { old_password, new_password, new_password2 } = req.body
            if (!old_password || !new_password || !new_password2) {
                res.send({ errmsg: '缺少必要参数' })
                return
            }
            // 两次密码是否一致
            if (new_password !== new_password2) {
                res.send({ errmsg: '两次密码不一致' })
                return
            }
            // 旧密码是否正确
            if (md5(md5(old_password) + keys.password_salt) !== userInfo[0].password_hash) {
                res.send({ errmsg: '旧密码不正确！' })
                return
            }
            // 更新数据库
            await handleDB(res, 'info_user', 'update', '数据库更新密码出错', `id=${userInfo[0].id}`, { password_hash: md5(md5(new_password) + keys.password_salt) })
            res.send({ errno: '0', errmsg: '修改密码成功' })
        }
    })()
})

// 头像设置
router.get('/user/pic_info', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)
        res.render('news/user_pic_info')
    })()
})
router.post('/user/pic_info', upload.single('avatar'), (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)

        let file = req.file
        try {
            await upload_file(file.originalname, `${file.destination}/${file.filename}`)
        } catch (error) {
            res.send({ errmsg: '上传七牛云失败' })
            return
        }

        await handleDB(res, 'info_user', 'update', '数据库头像更新失败', `id=${userInfo[0].id}`, { avatar_url: file.originalname })
        res.send({
            errno: '0', errmsg: '设置成功', data: {
                avatar_url: constant.QINIU_AVATAR_URL_PRE + file.originalname
            }
        })
    })()
})

// 我的收藏
router.get('/user/collection', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)
        let { currentPage = 1, perPage = 10 } = req.query
        let collectionCount = await handleDB(res, 'info_user_collection', 'sql', '数据库查询出错', `select count(*) from info_user_collection where user_id=${userInfo[0].id}`)

        let collectionNewsIds = await handleDB(res, 'info_user_collection', 'find', '数据库查询出错2', `user_id=${userInfo[0].id} limit ${(currentPage - 1) * perPage},${perPage}`)
        let collectionNewsList = []
        for (let i = 0; i < collectionNewsIds.length; i++) {
            let ret = await handleDB(res, 'info_news', 'sql', '数据库查询出错-新闻', `select create_time,title,id from info_news where id=${collectionNewsIds[i].news_id}`)
            collectionNewsList.push(ret[0])
        }
        let data = {
            currentPage,
            totalPage: Math.ceil(collectionCount[0]['count(*)'] / perPage),
            collectionNewsList
        }
        res.render('news/user_collection', data)
    })()
})

// 我的关注
router.get('/news/followed_user', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)

        let { currentPage = 1, perPage = 4 } = req.query
        // 查询已关注的用户
        let fansCount = await handleDB(res, 'info_user_fans', 'sql', '数据库查询出错', `select count(*) from info_user_fans where follower_id=${userInfo[0].id}`)
        let fansResult = await handleDB(res, 'info_user_fans', 'find', '数据库查询出错', `follower_id=${userInfo[0].id} limit ${(currentPage - 1) * perPage},${perPage}`)
        let fansList = []
        for (let i = 0; i < fansResult.length; i++) {
            let ret = await handleDB(res, 'info_user', 'find', '数据库查询出错', `id=${fansResult[i].followed_id}`)
            ret[0].avatar_url = ret[0].avatar_url ? constant.QINIU_AVATAR_URL_PRE + ret[0].avatar_url : '/news/images/worm.jpg'
            fansList.push(ret[0])
        }
        let isFollow = true

        let data = {
            currentPage,
            totalPage: Math.ceil(fansCount[0]['count(*)'] / perPage),
            fansList,
            isFollow
        }
        res.render('news/user_follow', data)
    })()
})

// 发布新闻
router.get('/user/news_release', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)
        res.render('news/user_news_release')
    })()
})

// 新闻列表
router.get('/user/news_list', (req, res) => {
    (async function () {
        let userInfo = await getUserInfo(req, res)
        res.render('news/user_news_list')
    })()
})

module.exports = router
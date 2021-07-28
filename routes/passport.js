const express = require('express')
const Captcha = require('../utils/captcha')
const { dateTime } = require('../utils/common')
const handleDB = require('../db/handleDB')
const md5 = require('md5')
const keys = require('../keys')
const router = express.Router()

// 验证码图片请求
router.get('/passport/image_code/:time', (req, res) => {
    let captchaObj = new Captcha()
    let captcha = captchaObj.getCode()
    // 验证码文本保存到session
    req.session['ImageCode'] = captcha.text

    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(captcha.data)
})

// 注册请求
router.post('/passport/register', (req, res) => {
    (async function () {
        let { username, image_code, password, agree } = req.body
        // 判断用户参数不符合规则执行
        if (!username || !image_code || !password || !agree) {
            res.json({ errmsg: '缺少必填参数' })
            return
        }
        // 判断验证码不正确执行
        if (image_code.toLowerCase() !== req.session['ImageCode'].toLowerCase()) {
            res.send({ errmsg: '验证码错误！' })
            return
        }
        // 查询用户名是否注册过
        let result = await handleDB(res, 'info_user', 'find', '数据库查询出错', `username="${username}"`)
        if (result[0]) {
            res.send({ errmsg: '用户名已经被注册' })
            return
        }
        // 如果没有注册过，则成功注册，往数据库插入数据
        let result2 = await handleDB(res, 'info_user', 'insert', '数据库插入出错', {
            username,
            password_hash: md5(md5(password) + keys.password_salt),
            nick_name: username,
            last_login: dateTime(new Date())
        })
        // 保持用户登录状态
        req.session['user_id'] = result2.insertId
        // 返回注册成功给前端
        res.send({ errno: '0', errmsg: '注册成功' })
    })()

})

// 登录请求
router.post('/passport/login', (req, res) => {
    (async function () {
        let { username, password } = req.body
        // 判断用户名密码是否为空
        if (!username || !password) {
            res.json({ errmsg: '缺少必填参数' })
            return
        }
        // 查询数据库，此用户名是否注册过
        let result = await handleDB(res, 'info_user', 'find', '数据库查询出错', `username="${username}"`)
        if (!result[0]) {
            res.send({ errmsg: '用户名未注册，登录失败！' })
            return
        }
        // console.log(result);
        // 查询数据库，密码是否正确
        if (result[0].password_hash !== md5(md5(password) + keys.password_salt)) {
            res.send({ errmsg: '用户名或密码错误，登录失败' })
            return
        }
        // 保持登录状态
        req.session['user_id'] = result[0].id
        // 设置最后一次登录时间
        await handleDB(res, 'info_user', 'update', '数据库修改出错', `id="${result[0].id}"`, { last_login: dateTime(new Date()) })
        // 返回登陆成功给前端
        res.send({ errno: '0', errmsg: '登陆成功' })
    })()
})

// 退出登录请求
router.post('/passport/logout', (req, res) => {
    delete req.session['user_id']
    res.send({ errmsg: '退出登陆成功' })
})

module.exports = router
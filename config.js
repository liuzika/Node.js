const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const { csrfProtect, abort404 } = require('./utils/common')
const keys = require('./keys')

// 引入各种路由文件
const indexRouter = require('./routes/index')
const passportRouter = require('./routes/passport')
const detailRouter = require('./routes/detail')
const profileRouter = require('./routes/profile')

// 函数的封装
// function appConfig(app) {
//     // 指定静态资源文件夹
//     app.use(express.static(__dirname + '/public'))

//     // POST 获取参数配置
//     app.use(express.urlencoded({ extended: false }))
//     app.use(express.json())

//     // 模板引擎配置
//     app.engine('html', require('express-art-template'))
//     app.set('view options', {
//         debug: process.env.NODE_ENV !== 'development'
//     })
//     app.set('views', path.join(__dirname, 'views'))
//     app.set('view engine', 'html')

//     // 注册cookie和session
//     app.use(cookieParser())
//     app.use(cookieSession({
//         name: 'my_session',
//         keys: ['LUT&AS$DST&F%SGIKYTGCVN&SGATGASO%F%TH&OPI%%HL'],
//         maxAge: 1000 * 60 * 60 * 24 * 2     // 2天
//     }))
// }

// 面向对象封装
class AppConfig {
    constructor(app) {
        this.app = app

        // 端口号
        this.listenPort = 3000

        // 指定静态资源文件夹
        this.app.use(express.static(__dirname + '/public'))

        // POST 获取参数配置
        this.app.use(express.urlencoded({ extended: false }))
        this.app.use(express.json())

        // 模板引擎配置
        this.app.engine('html', require('express-art-template'))
        this.app.set('view options', {
            debug: process.env.NODE_ENV !== 'development'
        })
        this.app.set('views', path.join(__dirname, 'views'))
        this.app.set('view engine', 'html')

        // 注册cookie和session
        this.app.use(cookieParser())
        this.app.use(cookieSession({
            name: 'my_session',
            keys: [keys.session_key],
            maxAge: 1000 * 60 * 60 * 24 * 2     // 2天
        }))

        // 注册路由
        this.app.use(csrfProtect, indexRouter)
        this.app.use(csrfProtect, passportRouter)
        this.app.use(csrfProtect, detailRouter)
        this.app.use(csrfProtect, profileRouter)

        this.app.use((req, res) => {
            (async function () {
                abort404(req, res)
            })()
        })
    }
}


module.exports = AppConfig
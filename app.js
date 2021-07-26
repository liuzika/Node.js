const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')

const app = express()

// 指定静态资源文件夹
app.use(express.static(__dirname + '/public'))

// POST 获取参数配置
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// 模板引擎配置
app.engine('html', require('express-art-template'))
app.set('view options', {
    debug: process.env.NODE_ENV !== 'development'
})
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'html')

// 注册cookie和session
app.use(cookieParser())
app.use(cookieSession({
    name: 'my_session',
    keys: ['LUT&AS$DST&F%SGIKYTGCVN&SGATGASO%F%TH&OPI%%HL'],
    maxAge: 1000 * 60 * 60 * 24 * 2     // 2天
}))


// 监听请求
app.get('/', (req, res) => {
    res.cookie('name', '123')
    req.session['age'] = '20'
    res.render('news/index')
})
app.get('/get_cookie', (req, res) => {
    res.send('获取到的cookie为' + req.cookies['name'])
})
app.get('/session', (req, res) => {
    res.send('session' + req.session['age'])
})

// 监听端口
app.listen(3000, () => {
    console.log('服务器已启动，端口：3000');
})
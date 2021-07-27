const express = require('express')
const AppConfig = require('./config')

const app = express()

// 配置文件的调用
let appConfig = new AppConfig(app)


// 监听端口
app.listen(appConfig.listenPort, () => {
    console.log(`服务器已启动，端口：${appConfig.listenPort}`);
})
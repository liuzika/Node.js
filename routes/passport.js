const express = require('express')
const Caotcha = require('../utils/captcha')
const router = express.Router()


router.get('/passport/image_code/:time', (req, res) => {
    let captchaObj = new Caotcha()
    let captcha = captchaObj.getCode()
    res.setHeader('Content-Type', 'image/svg+xml')
    res.send(captcha.data)
})


module.exports = router
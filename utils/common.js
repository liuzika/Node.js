/**
 * 
 * @param {object} date 时间对象 
 * @returns 当前时间
 */
function dateTime(date) {
    let fullYear = date.getFullYear()
    let month = date.getMonth() === 12 ? 1 : date.getMonth() + 1
    let day = date.getDate()
    let hours = date.getHours()
    let minutes = date.getMinutes()
    let seconds = date.getSeconds()
    return `${fullYear}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function getRandomString(n) {
    let str = ''
    while (str.length < n) {
        str += Math.random().toString(36).substr(2)
    }
    return str.substr(str.length - n)
}
function csrfProtect(req, res, next) {
    let method = req.method
    if (method === 'GET') {
        let csrf_token = getRandomString(48)
        res.cookie('csrf_token', csrf_token)
        next()
    } else if (method === 'POST') {
        if (req.headers['x-csrftoken'] === req.cookies['csrf_token']) {
            console.log('csrf验证通过！');
            next()
        } else {
            res.send({ errmsg: 'csrf验证不通过！' })
            return
        }
    }
}


module.exports = { dateTime, csrfProtect }
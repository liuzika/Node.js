const express = require('express')
const router = express.Router()

router.get('/liuzika', (req, res) => {
    res.send('1356')
})


module.exports = router
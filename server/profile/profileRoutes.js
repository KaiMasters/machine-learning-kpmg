const router = require('express').Router();
const controller = require('./profileController');

router.post('/', controller.newUser);

module.exports = router;
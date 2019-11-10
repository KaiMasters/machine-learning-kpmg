const router = require('express').Router();
const controller = require('./profileController');
const validator = require('./profileValidator');

router.post('/', validator.newProfile(), controller.newUser);

module.exports = router;
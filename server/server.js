const router = require('express').Router();

router.use('/profile', require('./profile/profileRoutes'));
router.use('/product', require('./product/productRoutes'));

module.exports = router;
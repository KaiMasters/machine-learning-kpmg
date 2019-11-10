const router = require('express').Router();
const controller = require('./productController');

router.route('/')
  .get(controller.getProducts)
  .post(controller.createProduct);

module.exports = router;
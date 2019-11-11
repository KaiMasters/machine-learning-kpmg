const router = require('express').Router();
const controller = require('./productController');
const validator = require('./productValidator');

router.route('/')
  .get(controller.getProducts)
  .post(validator.newProduct(), controller.createProduct);

router.get('/recommendations', controller.recommendProducts);

module.exports = router;
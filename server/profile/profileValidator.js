const { check } = require('express-validator');

exports.newProfile = function() {
  return [
    check('occupation')
      .exists()
      .withMessage('You must have an occupation to survive my guy')
      .trim()
      .isLength({  min: 1  })
      .withMessage(`Your occupation can't be empty`)
      .stripLow()
      .escape(),
    check('interests')
      .exists()
      .withMessage(`You must have some interests in life! Don't be a loser!`)
      .isArray()
      .withMessage('Interests must be an array'),
    check('purchases')
      .exists()
      .withMessage('Profile must contain products that have been purchased')
      .isArray()
      .withMessage('Products must be an array of MongoIDs')
  ]
};
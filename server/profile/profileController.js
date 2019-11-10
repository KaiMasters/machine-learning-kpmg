const Profile = require('./profileModel');
const { validationResult } = require('express-validator');

exports.newUser = (req, res, next) => {
    //res.json({ message: 'This is working!' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const newProfile = req.body;
    Profile.create(newProfile)
        .then(createdProfile => res.json('Profile successfully saved!'))
        .catch(err => res.json(`Could not update profile. Received an error: ${err}`));
};
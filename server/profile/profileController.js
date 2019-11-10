const Profile = require('./profileModel');
const { validationResult } = require('express-validator');

exports.newUser = (req, res, next) => {
    console.log(`Request object: ${JSON.stringify(req.body, null, ' ')}`);
    console.log('New profile being inserted into the database');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Could not insert new profile into the database');
        return res.status(422).json({ errors: errors.array() });
    }

    const newProfile = req.body;
    Profile.create(newProfile)
        .then(createdProfile => {
            console.log('New profile saved successfully');
            return res.status(201).json('Profile successfully saved!');
        })
        .catch(err => {
            console.log(`Could not insert new profile: ${err}`);
            return res.status(500).json(`Could not insert new profile. Received an error: ${err}`)
        });
};
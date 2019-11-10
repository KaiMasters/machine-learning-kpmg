const Profile = require('./profileModel');

exports.newUser = (req, res, next) => {
    //res.json({ message: 'This is working!' });
    const newProfile = req.body;
    Profile.create(newProfile)
        .then(createdProfile => res.json('Profile successfully saved!'))
        .catch(err => res.json(`Could not update profile. Received an error: ${err}`));
};
const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
    occupation: {
        type: String,
        required: true
    },
    categories: {
        type: Array,
        required: true
    }
});

module.exports = mongoose.model('profile', profileSchema);
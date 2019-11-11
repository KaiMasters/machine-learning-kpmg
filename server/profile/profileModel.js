const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
    occupation: {
        type: String,
        required: true
    },
    interests: {
        type: Schema.Types.Array,
        required: true,
    },
    purchases: {
        type: Schema.Types.ObjectId,
        ref: 'product'
    }
});

module.exports = mongoose.model('profile', profileSchema);
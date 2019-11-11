const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    brand: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('product', productSchema);
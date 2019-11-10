const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    manufacturer: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    sub_brand: {
        type: String,
        required: true,
        default: 'N/A'
    },
    category: {
        type: String,
        required: true
    },
    product_type: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('product', productSchema);
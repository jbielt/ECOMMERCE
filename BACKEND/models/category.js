const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    icon: {
        type: String
    },
    color: {
        type: String
    }
})

//crear un ID virtual que serà el utilitzat al front ( sense la _id).
categorySchema.virtual('id').get(function (){
    return this._id.toHexString();
});
categorySchema.set('toJSON',{
    virtuals: true
});

exports.Category = mongoose.model('Category', categorySchema);
exports.categorySchema = categorySchema;

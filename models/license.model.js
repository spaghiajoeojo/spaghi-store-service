const mongoose = require('mongoose');

//simple schema
const LicenseSchema = new mongoose.Schema({

    gameId: {
        type: String,
        required: true
    },
    code: {
        type: String,
        validate: {
            validator: function (v) {
                return /[0-9,A-Z]{4}-[0-9,A-Z]{4}-[0-9,A-Z]{4}/.test(v);
            }
        },
        default: generateCode,
        required: true,
        unique: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cost: {
        type: Number
    }
});

function generateCode() {
    return [stringGen(4), stringGen(4), stringGen(4)].join('-');
}

function stringGen(len) {
    let text = "";

    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (let i = 0; i < len; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));

    return text;
}

const License = mongoose.model('License', LicenseSchema);

exports.License = License;
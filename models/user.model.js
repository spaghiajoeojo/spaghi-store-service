const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

let generateTagNumber = function () {
    return (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
}

//simple schema
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 255
    },
    tag: {
        type: Number,
        default: generateTagNumber
    },
    avatar: {
        data: Buffer,
        contentType: String
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    currency: {
        type: Number,
        default: 0
    },
    vip: {
        type: Boolean,
        default: true
    },
    admin: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: Date
    }
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

UserSchema.virtual('online').get(function () {
    return (Date.now() - this.lastSeen) < 1000 * 60 * 5;
});

//custom method to generate authToken 
UserSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({
        _id: this._id,
        expiration: config.get("lifetime_token") != -1 ? (new Date().getTime() + (config.get("lifetime_token") * 1000)) : -1
    }, config.get('token_salt')); //get the private key from the config file -> environment variable
    return token;
}


const User = mongoose.model('User', UserSchema);

//function to validate user 
function validateUser(user) {
    const schema = {
        name: Joi.string().min(3).max(50).regex(/^[^#]+$/).required(),
        email: Joi.string().min(5).max(255).required().email(),
        password: Joi.string().min(3).max(255).required()
    };

    return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;
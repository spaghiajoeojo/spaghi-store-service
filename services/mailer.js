var nodemailer = require('nodemailer');
const config = require("config");

var transporter = nodemailer.createTransport(config.get("nodemailer"));



transporter.notifySignUp = (email, username, password) => {
    transporter.sendMail({
        to: email, // list of receivers
        subject: 'Welcome ' + username, // Subject line
        html: '<p>Hi ' + username + ',</p><p>you are now a family member of the spaghi gang.</p>' + (password ? '<p>Mind your password: ' + password + '</p>' : '')
    }, function (err, info) {
        if (err)
            console.log(err)
        else
            console.log(info);
    });
};

module.exports = transporter;
const fs = require("fs");
const config = require("config");
const mongoose = require("mongoose");
const usersRoute = require("./routes/user.route");
const gamesRoute = require("./routes/game.route");
const express = require("express");
const app = express();
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
const UDPServer = require("./serverudp");
const https = require("https");
const notifier = require("./services/notifier");


//use config module to get the privatekey, if no private key set, end the application
if (!config.get("token_salt")) {
    console.error("FATAL ERROR: token_salt is not defined.");
    process.exit(1);
}
let mongoOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
//connect to 
mongoose
    .connect(config.get("mongodb_url"), mongoOpts)
    .then(() => console.log("Connected to MongoDB..."))
    .catch(err => console.error("Could not connect to MongoDB..."));



app.use(express.json());
//use users route for api/users
app.use("/api/users", usersRoute);
app.use("/api/games", gamesRoute);

app.use(function (err, req, res, next) {
    // error middleware
});

const port = process.env.PORT || 3000;
let credentials;
if (config.has("credentials")) {
    let crt_config = config.get("credentials");
    credentials = {
        key: fs.readFileSync(crt_config.key),
        cert: fs.readFileSync(crt_config.cert)
    };
} else {
    credentials = {
        key: fs.readFileSync(__dirname + '/cert/selfsigned.key'),
        cert: fs.readFileSync(__dirname + '/cert/selfsigned.crt')
    };
}

let server = https.createServer(credentials, app).listen(port, () => console.log(`Listening on port ${port}...`));
let wss = new WebSocket.Server({
    server: server,
    path: "/connect"
}, () => {
    notifier.setWebSocketServer(wws);
});

server.on('upgrade', function (req, socket, head) {
    auth(req, null, (err) => {

        if (err) {
            console.log(err);
            socket.destroy();
            return;
        }

        notifier.add(req.user, socket);

    });
});








UDPServer.bind(2222)
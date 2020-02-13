const config = require("config");
const mongoose = require("mongoose");
const usersRoute = require("./routes/user.route");
const express = require("express");
const app = express();
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");

//use config module to get the privatekey, if no private key set, end the application
if (!config.get("token_salt")) {
    console.error("FATAL ERROR: token_salt is not defined.");
    process.exit(1);
}
let mongoOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};
//connect to mongodb
mongoose
    .connect(config.get("mongodb_url"), mongoOpts)
    .then(() => console.log("Connected to MongoDB..."))
    .catch(err => console.error("Could not connect to MongoDB..."));


app.use(express.json());
//use users route for api/users
app.use("/api/users", usersRoute);

app.use(function(err, req, res, next) {
    // error middleware
});

const port = process.env.PORT || 3000;
let server = app.listen(port, () => console.log(`Listening on port ${port}...`));
let wss = new WebSocket.Server({
    noServer: true,
    path: "/connect"
});

server.on('upgrade', function (req, socket, head) {
    auth(req, null, (err) => {
        if (err) {
            socket.destroy();
            return;
        }
        // authentication succeded
        wss.handleUpgrade(req, socket, head, function (ws) {
            wss.emit('connection', ws, req);
        });
    });
});
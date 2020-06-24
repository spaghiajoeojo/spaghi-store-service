const {
    User
} = require("../models/user.model");
let notifier = {
    userToSocket: new Map(),
    socketToUser: new Map()
};

notifier.setWebSocketServer = (server) => {
    notifier.wss = server;
    notifier.wss.on("connection", (ws) => {
        let userId = notifier.socketToUser.get(ws)._id;
        let user = User.findById(userId).populate("friends");
        user.friends.forEach((friend) => {
            notifier.userToSocket.get(friend._id).send({
                type: "notification",
                msg: `${friend.name} is now online.`
            });
        });
    });

    notifier.wss.on('close', (ws) => {
        notifier.remove(ws);
    });
};

notifier.notify = (idUser, msg) => {

};

notifier.add = (user, socket) => {
    notifier.userToSocket.set(user._id, socket);
    notifier.socketToUser.set(socket, user._id);
};

notifier.remove = (socket) => {
    let userId = notifier.socketToUser.get(socket);
    notifier.socketToUser.delete(socket);
    notifier.userToSocket.delete(userId);
};



module.exports = notifier;
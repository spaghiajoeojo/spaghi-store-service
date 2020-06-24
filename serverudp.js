var udp = require('dgram');

// creating a udp server
const UDPServer = udp.createSocket('udp4');


// emits when any error occurs
UDPServer.on('error', function (error) {
    console.log('Error: ' + error);
    UDPServer.close();
});

// emits on new datagram msg
UDPServer.on('message', function (msg, info) {
    console.log('Data received from client : ' + msg.toString());
    console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
    let addr = `${info.address}:${info.port}`;

    //sending msg
    UDPServer.send(addr, info.port, info.address, function (error) {
        if (error) {
            console.error(error);
            client.close();
        } else {
            console.log('Response sent.');
        }
    });

});

//emits when socket is ready and listening for datagram msgs
UDPServer.on('listening', function () {
    var address = UDPServer.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log('UDP Server is listening at port ' + port);
    console.log('Server ip :' + ipaddr);
    console.log('Server is IP4/IP6 : ' + family);
});

//emits after the socket is closed using socket.close();
UDPServer.on('close', function () {
    console.log('Socket is closed !');
});

module.exports = UDPServer;
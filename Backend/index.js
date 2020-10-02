const express = require("express");
const { connection } = require("websocket");
const WebSocketServer = require("websocket").server;

const app = express();
const port = process.env.PORT || 9000;
const httpServer = app.listen(port, () => console.log(`Listening on port ${port}`));
const websocket = new WebSocketServer({ httpServer });

app.use(express.static(__dirname + '../Frontend'));

app.get("/", (request, response) => {
    response.render('index.html');
})

websocket.on("request", handleRequest);

const connections = [];
function handleRequest(request) {
    const connection = request.accept(null, request.origin);
    connections.push(connection);
    connection.on("open", (message) => respondWithColorAssignment(message, connection))
    connection.on("close", () => console.log("Connection is closed"));
    connection.on("message", (message) => handleMessage(message, connections));
}

function respondWithColorAssignment(message, connection){
    let currentColorAssignment = "white"
    if(currentColorAssignment === "white"){
        connection.send(currentColorAssignment)
        currentColorAssignment = "black"
    } else {
        connection.send(currentColorAssignment)
        currentColorAssignment = "white"
    }
}


function handleMessage(message, connections) {

    connections.forEach(connection => connection.send(message));
}

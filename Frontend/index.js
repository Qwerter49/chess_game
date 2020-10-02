import {INPUT_EVENT_TYPE, MOVE_INPUT_MODE, COLOR, Chessboard} from "./src/cm-chessboard/Chessboard.js"

const webSocketURL = "ws://localhost:9000";
let railsBaseURL = 'http://localhost:3000/'

let form = document.querySelector("#auth-form")
const loginButton = document.querySelector('#login-button')
const logoutButton = document.querySelector("#logout-button")

let token = localStorage.token

if(token && token != 'undefined'){
    authorizeUser(token)
}

form.addEventListener('submit', (event) => signUp(event, 'users'))
loginButton.addEventListener('click', (event)=> signUp(event, 'login'))
logoutButton.addEventListener('click', logout)

const chess = new Chess()

function goToRoomOne(event, result){
    const profileContainer = document.querySelector("#profile-container")
    const gameContainer = document.querySelector("#game-container")
    profileContainer.style.display = "none"
    gameContainer.style.display = "flex"
    handleConnect(event, result)

    window.board = new Chessboard(document.getElementById("board"), {
        position: chess.fen(),
        sprite: {url: "../assets/images/chessboard-sprite.svg"},
        orientation: COLOR.white,
        moveInputMode: MOVE_INPUT_MODE.dragPiece
    })
    window.board.enableMoveInput(inputHandler, COLOR.white)
}

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function inputHandler(event) {
    console.log("event", event)
    webSocket.send(event);
    if (event.type === INPUT_EVENT_TYPE.moveDone) {
        const move = {from: event.squareFrom, to: event.squareTo}
        const result = chess.move(move)
        if (result) {
            event.chessboard.disableMoveInput()
            setTimeout(() => {
                event.chessboard.setPosition(chess.fen())
                const possibleMoves = chess.moves({verbose: true})
                if (possibleMoves.length > 0) {
                    const randomMove = possibleMoves[random(0, possibleMoves.length - 1)]
                    chess.move({from: randomMove.from, to: randomMove.to})
                    event.chessboard.enableMoveInput(inputHandler, COLOR.white)
                    event.chessboard.setPosition(chess.fen())
                }
            })
        } else {
            console.warn("invalid move", move)
        }
        return result
    } else {
        return true
    }
}

function logout(){
    localStorage.removeItem('token')
}

function authorizeUser(token){
    fetch(railsBaseURL + 'profile', {
        method: 'GET',
        headers: {
            'Content-type': "application/json",
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(result => goToProfile(result))
}

function goToProfile(result){
    if(!result.message){
        const roomOneButton = document.querySelector("#room-one-button")
        const loginContainer = document.querySelector("#login-container")
        const profileContainer = document.querySelector("#profile-container")
        const usernameContainer = document.querySelector("#username-container")
        const roomsContainer = document.querySelector("#rooms-container")
        loginContainer.style.display = "none"
        profileContainer.style.display = "flex"
        usernameContainer.innerHTML = `<h2>Welcome ${result.username}!</h2><h3>Please choose a room</h3>`
        roomOneButton.addEventListener('click', (event) => goToRoomOne(event, result))
    } else {
        alert(result.message)
    }
}

function signUp(event, path){
    event.preventDefault();

    let formData = new FormData(form)
    let username = formData.get('username')
    let password = formData.get('password')

    fetch(railsBaseURL + path, {
        method: 'POST',
        headers: {
            'Content-Type': "application/json"
        },
        body: JSON.stringify({
            username,
            password
        })
    })
    .then(response => response.json())
    .then(result => {
        if(path === 'login'){
            login(result)
        }
    })
}

function login({user, token}){
    localStorage.setItem('token', token)
}

function handleConnect(event, result) {
    if (webSocket.readyState === 1) {
        enterUserIntoChat(event, result);
    } else {
        createWebSocket().then(socket => {
            webSocket = socket;
            handleConnect(event, result);
        });
    }
}

function enterUserIntoChat(event, result) {
    webSocket.send(`${result.username} says hello world`);
    webSocket.send(`${result.username} asks, What color am I?`)
}

const createWebSocket = () => {
    const newWebSocket = new WebSocket(webSocketURL);
    newWebSocket.onmessage = handleMessage;
    return new Promise(resolve => waitForReadyState(resolve, newWebSocket));
}

function waitForReadyState(resolve, newWebSocket) {
    if (newWebSocket.readyState === 1) { return resolve(newWebSocket); }
    else { setTimeout(() => waitForReadyState(resolve, newWebSocket), 40); }
}

let webSocket;
createWebSocket().then(socket => webSocket = socket);

function handleMessage(message) {
    let whatWasReturned = {message}
    console.log(whatWasReturned)
    
}


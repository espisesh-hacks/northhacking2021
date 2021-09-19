console.log("Starting WS Gateway server...");
const { WebSocketServer } = require('ws');
const { Pool, Client } = require('pg');
const crypto = require('crypto');

const wss = new WebSocketServer({ port: 8080 });

let clients = [];

async function main() {
    const pool = new Pool({
        user: 'root',
        host: '192.168.1.128',
        database: 'defaultdb',
        password: '',
        port: 26257
    });
    let res = await pool.query('SELECT NOW()');
    console.log(res.rows);

    wss.on('connection', function connection(ws) {
        let user;
        ws.on('message', async function incoming(message) {
            console.log('received: %s', message);
            let msg = JSON.parse(message);
            switch(msg.action) {
                case "hello": {
                    // todo BAD BAD BAD DONT USE MD5 SWITCH TO ARGON2 OR SOMETHING
                    let hash = crypto.createHash('sha256').update(msg.payload.password).digest('hex');
                    let res = await pool.query("SELECT * FROM users WHERE username = $1", [msg.payload.username]);
                    console.log(res);
                    console.log(hash)
                    if(hash === res.rows[0].password) {
                        ws.send(JSON.stringify({
                            action: "auth-status",
                            payload: {
                                login: true
                            }
                        }));
                        // store this connection
                        clients[msg.payload.username] = ws;
                        console.log("storing user:")
                        user = res.rows[0];
                    } else {
                        ws.send(JSON.stringify({
                            action: "auth-status",
                            payload: {
                                login: false
                            }
                        }));
                    }
                } break;

                // todo make sure hello was sent first
                case "get-users": {
                    if(user === undefined) { ws.send(JSON.stringify({action: "error", payload: {message: "Not Authenticated"}})); return; }
                    const res = await pool.query("SELECT username, displayname FROM users");
                    console.log(res);
                    ws.send(JSON.stringify({
                        action: "user-list",
                        payload: res.rows
                    }));
                } break;
                case "request-push-container": {
                    if(user === undefined) { ws.send(JSON.stringify({action: "error", payload: {message: "Not Authenticated"}})); return; }
                    // payload targetUsername, containerID
                    // check if client is not null;
                    if(clients[msg.payload.targetUsername] === undefined) {
                        console.log("Attempted to push to a user who is not online");
                        ws.send(JSON.stringify({
                            action: "error",
                            payload: {
                                message: "Attempted to push to a user who is not online."
                            }
                        }));
                        return;
                    } else {
                        clients[msg.payload.targetUsername].send(JSON.stringify({
                            action: "push-container",
                            payload: {
                                requestUser: {
                                    username: user.username,
                                    displayname: user.displayname
                                }
                            }
                        }));
                    }

                    //send back container-push-status

                } break;
                default:
                    console.log("Unknown action message:");
                    console.log(msg);
                    ws.send(JSON.stringify({
                        action: "error",
                        payload: {
                            message: "Unknown action message."
                        }
                    }));
            }
        });

        //ws.send('something');
    });
}
main().then(() => {
    console.log("Listening on port 8080");
});



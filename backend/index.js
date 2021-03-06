console.log("Starting Paracrates WS Gateway server...");
const { WebSocketServer } = require('ws');
const { Pool, Client } = require('pg');
const crypto = require('crypto');

const {updateLatestAction, bindChangeFeeds} = require("./sync_servers");

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
    console.log("Testing CockroachDB Connection: ");
    try {
        const res = await pool.query('SELECT NOW()');
        console.log(res.rows);
        console.log("Success!");
    } catch(e) {
        console.log(e);
        console.log("Failed to query CockroachDB.");
        process.exit(-1);
    }

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
                    //if(user === undefined) { ws.send(JSON.stringify({action: "error", payload: {message: "Not Authenticated"}})); return; }
                    const res = await pool.query("SELECT username, displayname FROM users");
                    console.log(res);
                    ws.send(JSON.stringify({
                        action: "user-list",
                        payload: res.rows
                    }));
                } break;
                case "request-push-container": {
                    if(user === undefined) { ws.send(JSON.stringify({action: "error", payload: {message: "Not Authenticated"}})); return; }
                    // payload targetUsername, containerID, appName
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
                                },
                                containerID: msg.payload.containerID,
                                appName: msg.payload.appName
                            }
                        }));
                    }

                    //send back container-push-status

                } break;
                case "push-container-status": {
                    if(user === undefined) { ws.send(JSON.stringify({action: "error", payload: {message: "Not Authenticated"}})); return; }
                    // payload requestUsername, status ("accept/deny")
                    // Target sends acceptance message to request user
                    clients[msg.payload.requestUsername].send(JSON.stringify({
                        action: "push-container-status",
                        payload: {
                            targetUsername: user.username,
                            status: msg.payload.status
                        }
                    }));
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
            // Notify other servers of state change.
            await updateLatestAction(msg, user, pool);
        });
        ws.on('close', function close() {
            console.log('Client Disconnected');

        });

        //ws.send('something');
    });
}
main().then(async () => {
    console.log("Listening on port 8080");
    console.log("Subscribing to CockroachDB Changefeeds...");
    await bindChangeFeeds();
});



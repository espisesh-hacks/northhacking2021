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
                    } else {
                        ws.send(JSON.stringify({
                            action: "auth-status",
                            payload: {
                                login: false
                            }
                        }));
                    }
                } break;
                case "get-users": {
                    const res = await pool.query("SELECT username, displayname FROM users");
                    console.log(res);
                    ws.send(JSON.stringify({
                        action: "user-list",
                        payload: res.rows
                    }));
                } break;
                case "request-container-push": {
                    // payload targetUsername, containerID

                } break;
                default:
                    console.log("Unknown Action message:");
                    console.log(msg);
            }
        });

        //ws.send('something');
    });
}
main().then(() => {
    console.log("Listening on port 8080");
});



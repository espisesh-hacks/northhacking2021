// Push user WS actions to DB
// This is used with changefeeds (Enterprise CockroadDB feature) to
// synchronize the microservices cluster.

async function updateLatestAction(action, user, pool) {
    if(user !== undefined) {
        await pool.query("UPDATE users SET action = $1 WHERE username = $2", [action, user.username]);
        await pool.query(
            "INSERT INTO state_changes(username, timestamp, action) VALUES ($1, $2, $3)",
            [user.username, new Date().toISOString(), action]
        );
        console.log("Notified state change through CockroachDB changefeed!");
    }
}

async function bindChangeFeeds() {
    // docker run --rm -it christoofar/cockroachdb-arm64 sql --url="postgresql://root@192.168.1.128:26257?sslmode=disable" --format=csv --execute="EXPERIMENTAL CHANGEFEED FOR state_changes;"
    // todo remove pi specific configuration
    const { spawn } = require('child_process');
    const cf = spawn('docker', ['run', '--rm', 'christoofar/cockroachdb-arm64',
        'sql',
        '--url="postgresql://root@192.168.1.128:26257?sslmode=disable"',
        '--format=csv',
        '--execute="EXPERIMENTAL CHANGEFEED FOR state_changes;"'
    ]);

    cf.stdout.on('data', (data) => {
        console.log(`changefeed stdout: ${data}`);
    });

    cf.stderr.on('data', (data) => {
        console.error(`changefeed stderr: ${data}`);
    });

    cf.on('close', (code) => {
        console.log(`changefeed child process exited with code ${code}`);
    });

    console.log("Done!");

}
module.exports = {updateLatestAction, bindChangeFeeds};

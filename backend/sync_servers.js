// Push user WS actions to DB
// This is used with changefeeds (Enterprise CockroadDB feature) to
// synchronize the microservices cluster.

async function updateLatestAction(action, user, pool) {
    if(user !== undefined) {
        const res = await pool.query("UPDATE users SET action = $1 WHERE username = $2", [action, user.username]);
        console.log("Notified state change through CockroachDB changefeed!");
    }
}
module.exports = {updateLatestAction};

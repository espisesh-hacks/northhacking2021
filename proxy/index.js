var proxy = require('failover-proxy')({
  hosts: [
    {
      host: '192.168.1.123',
      port: 25565
    },
    {
      host: '192.168.1.183',
      port: 25565
    }
  ]
});

proxy.listen(25565);

proxy.on('cycle', function (badHost, newHost) {
  //
  // `cycle` event happens when proxy couldn't contact the backend host and
  // switched to the next server. You can put your own reporting logic in here.
  //
  console.log("Switched from " + badHost + " to " + newHost);
});
console.log("Proxy is listening");

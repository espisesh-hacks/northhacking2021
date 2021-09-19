# Websocket Gateway API Doc

## Auth Flow
Send a "hello" message to backend:
> {"action": "hello", "payload": {"username": "seshpenguin", "password": "1234"}}

Receive a login-status:
> {"action":"auth-status","payload":{"login":true}}

## Push Container flow
(Seshpenguin is pushing a container to koitu)

Seshpenguin sends:
> {"action": "request-push-container", "payload": {"targetUsername": "koitu", "containerID": "1234", "appName": "Cool App"}}

Koitu recieves
> {"action":"push-container","payload":{"requestUser":{"username":"seshpenguin","displayname":"Seshan Ravikumar"}, "containerID": "1234", "appName": "Cool App"}}

*Modal pops up for verification on Koitus screen*

Koitu sends status back to seshpenguin:
> {"action": "push-container-status", "payload": {"requestUsername": "seshpenguin", "status": "accept"}}

Finally seshpenguin receives the confirmation from koitu
> {"action":"push-container-status","payload":{"targetUsername":"koitu","status":"accept"}}

# Misc

Get all users:
> {"action": "get-users", "payload": {}}

and you receive:
> {
      "action": "user-list",
      "payload": [
          {
              "username": "seshpenguin",
              "displayname": "Seshan Ravikumar"
          },
          {
              "username": "koitu",
              "displayname": "Andrew Koitu"
          },
          {
              "username": "espidev",
              "displayname": "Devin Lin"
          }
      ]
  }

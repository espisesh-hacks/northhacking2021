import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import { Button, Navbar, Container, Row, Col, Modal, Form, Card, Spinner, ListGroup, Nav } from 'react-bootstrap';
import './App.global.css';
import ayaya from "./ayaya.png"

import { Dropdown } from '@fluentui/react';

class MainScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      socket: null,
      username: "",
      password: "",
      processes: "",
      selectedP: "",
      loginModal: true,
      migrateModal: false,
      containerID: "placeholder",
      userID: "someone",
      users: [],
      usersJSX: ""
    }
  }
  componentDidMount() {
    this.getProcesses();
    
    console.log("Establishing Gateway Connection...");
    
    let socket = new WebSocket("ws://192.168.1.128:8080");
    socket.onopen = (event) => {
      console.log("Connected!");
      this.setState({connected: true, socket});
      
      this.state.socket.send(JSON.stringify({action: "get-users"}));
    };
    
    socket.onmessage = (event) => {
      console.log(event.data);
      let msg = JSON.parse(event.data)
      switch(msg.action) {
        case "auth-status":
          if (msg.payload.login) {
            console.log('logged in');
            this.setState({loginModal: false});
          } else {
            alert("Login Failed!");
          }
          break;
        case "get-users":
            for (let p of msg.payload) {
                console.log("user: " + p);
                users.push(p);
                usersJSX.push();
            }
            break;
       }
    };
  }

  auth() {
    this.state.socket.send(JSON.stringify({
      action: "hello",
      payload: {
        username: this.state.username,
        password: this.state.password
      }
    }));
  }
  
  getProcesses() {
    // [{"Command":"\"docker-entrypoint.s…\"","CreatedAt":"2021-07-06 19:16:31 -0400 EDT","ID":"0062c3ab5c99","Image":"redis","Labels":"","LocalVolumes":"1","Mounts":"a5a0681425a12d…","Names":"redis","Networks":"bridge","Ports":"0.0.0.0:6379->6379/tcp, :::6379->6379/tcp","RunningFor":"2 months ago","Size":"0B (virtual 105MB)","State":"running","Status":"Up 2 hours"}]
    this.setState({processes: JSON.parse(window.electron.myPing())});
  }
  
  
  
  render() {
    if (this.state.processes === "") {
      return(
        <div>Loading...</div>
      )
    }
    
    // cards (pJSX)
    let pJSX = [];
    let i = 0;
    for (let p of this.state.processes) {
      pJSX.push(<div >
        <Card className="app-card" onClick={() => {this.setState({selectedP: p.ID})}} style={{backgroundColor: this.state.selectedP === p.ID ? "lightblue" : ""}}>
          <Card.Body>
            <Card.Title><p>{p.Image}</p></Card.Title>
            <p>{p.ID}</p>
            <Button variant="secondary" style={{ fontFamily: "Nunito, sans-serif"}} onClick={ () => this.setState({ migrateModal: true })}>Push To User</Button>
          </Card.Body>
        </Card>
        <br />
      </div>)
    }
    
    return (
        
      <div style={{height: "100%"}}>
        
        {/* login modal */}
        <Modal show={this.state.loginModal} onHide={() => {}} centered>
          <Modal.Header>
            <Modal.Title>Login</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control type="username" placeholder="Enter username"  onChange={e => this.setState({ username: e.target.value })}/>
                <Form.Text className="text-muted">
                  We'll never share your info with anyone else.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Password" onChange={e => this.setState({ password: e.target.value })}/>
              </Form.Group>
              <Form.Group className="mb-3" controlId>
                <Form.Check type="checkbox" label="Remember Me" />
              </Form.Group>
            </Form>
          </Modal.Body>
          {this.state.connected ? <Modal.Footer>
            <Button variant="secondary" onClick={() => {alert("Not Implemented")}}>
              Register
            </Button>
            <Button variant="primary" onClick={() => this.auth()}>
              Login
            </Button>
          </Modal.Footer> : <center><Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner><br /><br /></center> }

        </Modal>
        
        {/* migrate modal */}
        
        <Modal show={this.state.migrateModal} onHide={() => {this.state.migrateModal = false}} centered>
        
            <Modal.Header>
                <Modal.Title>Clone to user</Modal.Title>
            </Modal.Header>
            
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                    <Form.Label>Which user do you want to push the application to?</Form.Label>
                    
                    <Dropdown
                        placeholder="Select a user"
                        label="Please SELECT THE USER!!!"
                        options={ [{key: "a", text: "a"}, {key: "b", text: "b"}]this.state.users.map(user => { return { key: user.username, text: user.displayname } }) } } 
                        styles={{ dropdown: { width: 300 } }}
                    />
                    </Form.Group>
                    
                </Form>
            </Modal.Body>
        
        </Modal>
        
        {/* navbar */}
        <Navbar bg="dark" variant="dark">
          <Container>
            <Navbar.Brand href="#home">
              <Row>
              <img
                alt=""
                src={ayaya}
                width="30"
                height="30"
                className="d-inline-block align-top"
              />{' '}
              <h4 style={{fontWeight: 400}}>FluentUI</h4>
              </Row>
            </Navbar.Brand>
          </Container>
        </Navbar>
        
        <Row style={{height: "90vh"}}>
        
          {/* sidebar */}
          <Col xs={3} style={{backgroundColor: "#03a9f4", fontWeight: 700, color: "white", padding: "25px"}}>
            <p>Processes</p>
          </Col>
          
          {/* content */}
          <Col style={{padding: "25px", maxWidth: "60%", height: "100vh"}}>
            <h3>App Environments</h3>
            <pre>
              {pJSX}
              <Button style={{position: "absolute", bottom: "25px"}}>Fling Environment to User</Button>
            </pre>
          </Col>
        </Row>
        
        {this.state.connected ? <div style={{position: "absolute", bottom: "10px", left: "10px", color: "green"}}>
          <p>Connected to Gateway</p>
        </div> : <div style={{position: "absolute", bottom: "10px", left: "10px", color: "red"}}>
          <p>Not Connected to Gateway</p>
        </div> }
      </div>
    );
  }
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={MainScreen} />
      </Switch>
    </Router>
  );
}

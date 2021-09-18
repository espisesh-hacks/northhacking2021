import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import { Button, Navbar, Container, Row, Col } from 'react-bootstrap';
import './App.global.css';
import ayaya from "./ayaya.png"

class MainScreen extends React.Component {
  getProcesses() {

    console.log(exec("ls"));
  }
  render() {
    return (
      <div style={{height: "100%"}}>
        <Navbar bg="dark" variant="dark">
          <Container>
            <Navbar.Brand href="#home">
              <img
                alt=""
                src={ayaya}
                width="30"
                height="30"
                className="d-inline-block align-top"
              />{' '}
              North Hacking 2021
            </Navbar.Brand>
          </Container>
        </Navbar>
        <Row style={{height: "90vh"}}>
          <Col xs={3} style={{backgroundColor: "lightgray", padding: "25px"}}>
            <h3>Friends</h3>
            <hr />

          </Col>
          <Col style={{padding: "25px"}}>
            <h3>Your Processes</h3>
            <p>

            </p>
          </Col>
        </Row>
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

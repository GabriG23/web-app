import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import API from './API';
import HomePage from './Components/homePage';
import GuestPage from './Components/guestPage';
import UserPage from './Components/userPage';

function App() {
  return (
    <Router>
      <App2 />
    </Router>
  )
}

function App2() {

  const [user, setUser] = useState({}); // stato utente loggato
  const [loggedIn, setLoggedIn] = useState(false);  // stato per il login
  const [guestIn, setGuestIn] = useState(false);  // stato per il guest

  const [message, setMessage] = useState(''); // stato per il messaggio iniziale
  const [access, setAccess] = useState(false); // controllo del login
  const navigate = useNavigate();

  useEffect(() => { // login
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
        setAccess(false);
      } catch (err) {
        handleError(err);
      }
    };
    if (access)
      checkAuth();
  }, [access]);

  const doGuestIn = () => {
    setGuestIn(true);
    const u = {CodU: 0};
    setUser(u);
    setMessage('');
    navigate('/guest');
  }

  const doLogIn = (credentials) => {
    API.logIn(credentials)
      .then(user => { setLoggedIn(true); setUser(user); setMessage(''); navigate('/user'); })
      .catch(err => { setMessage(err); })
  }

  const doLogOut = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser({});
  }

  const doGuestOut = async () => {
    setGuestIn(false);
  }

  function handleError(err) {
    console.log(err);
  }

  return (
    <>
      <Routes>
        <Route path='/' element={loggedIn ? (guestIn ? <Navigate to='/guest' /> : <Navigate to='/user' />) : <HomePage user = {user} login = {doLogIn} guestin = {doGuestIn} />} />
        <Route path='/guest' element={guestIn ? <GuestPage user = {user} action = {doGuestOut} /> : <Navigate to='/' />} />
        <Route path='/user' element={loggedIn ? <UserPage user = {user} action = {doLogOut} /> : <Navigate to='/' />} />
     </Routes>
      <Container>
        <Row>
          <Col>
            {message ? <Alert variant='danger' onClose={() => setMessage('')} dismissible>{message}</Alert> : false}
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default App;

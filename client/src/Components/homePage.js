import { Form, Button, Container, Alert, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import Intestazione from './intestazione';
import '../custom.css';

function HomePage(props) { // props: user = {false} login = {doLogIn} guestin = {doGuestIn}

    const [username, setUsername] = useState('u1@p.it');
    const [password, setPassword] = useState('password');
    const [errorMessage, setErrorMessage] = useState('');

    const handleGuest = (event) => {
        event.preventDefault();
        setErrorMessage('');
        props.guestin();
    };

    const handleUser = (event) => {
        event.preventDefault();
        setErrorMessage('');
        const credentials = { username, password };

        let valid = true;
        if (username === '' || password === '')
            valid = false;

        if (valid)
            props.login(credentials);
        else
            setErrorMessage('Username o password non valide.');
    };

    return (
        <>
            <Container>
                <Row>
                    <Intestazione tipo={'home'} user={props.user} />
                </Row>
                <Row>
                    <Col sm={6} className='below-nav'>
                        <h2>Login Utente registrato</h2>
                        <Form>
                            {errorMessage ? <Alert variant='danger' onClose={() => setErrorMessage('')} dismissible>{errorMessage}</Alert> : ''}
                            <Form.Group controlId='username'>
                                <Form.Label>email</Form.Label>
                                <Form.Control type='email' value={username} onChange={ev => setUsername(ev.target.value)} />
                            </Form.Group>
                            <br></br>
                            <Form.Group controlId='password'>
                                <Form.Label>Password</Form.Label>
                                <Form.Control type='password' value={password} onChange={ev => setPassword(ev.target.value)} />
                            </Form.Group>
                            <br></br>
                            <Button onClick={handleUser}>Login</Button>
                        </Form>
                    </Col>
                    <Col sm={6} className='below-nav'>
                        <h2>Utente Ospite</h2>
                        <br></br>
                        <Form>
                            <Button onClick={handleGuest}>Gioca a Categorie!!!</Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default HomePage;
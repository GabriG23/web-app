import API from '../API';
import '../custom.css';
import { Container, Row, Col, Alert, Form, Button, Table } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import Timer from './timer'

function GameForm(props) { // props: user = {props.user} selectedCategory = {selectedCategory} selectedDifficulty = {selectedDifficulty} setStopRound = {setStopRound} stopRound = {stopRound}

    const [correctAnswers, setCorrectAnswers] = useState([]);          // lista delle parole corrette con punteggi
    const [answersGiven, setAnswersGiven] = useState([]);             // lista delle parole inserite
    const [selectedCharacter, setSelectedCharacter] = useState('');  // lettera selezionata
    const [timestamp, setTimestamp] = useState('');  // lettera selezionata

    function handleError(err) {
        console.log(err);
    }

    function checkAnswersGuest(answersGiven, category, user, character) {
        API.checkAnswersGuest(answersGiven, category, user, character)
            .then((risposte) => { setCorrectAnswers(risposte); }) // answer.text
            .catch(err => handleError(err));
    }

    function checkAnswersUser(answersGiven, category, difficulty, user, character, timestamp) {
        API.checkAnswersUser(answersGiven, category, difficulty, user, character, timestamp)
            .then((risposte) => { setCorrectAnswers(risposte); }) // answer.text e answer.score
            .catch(err => handleError(err));
    }

    useEffect(() => {
        if (props.stopRound === true) { // ovvero quando si resetta il timer oppure si clicca termina round
            if (props.user.CodU === 0)// utente guest
                checkAnswersGuest(answersGiven, props.selectedCategory, props.user, selectedCharacter); // invio le domande, in listva
            else // utente loggato
                checkAnswersUser(answersGiven, props.selectedCategory, props.selectedDifficulty.d1, props.user, selectedCharacter, timestamp);
        } else { // entra quando cambio difficoltà e categoria
            setTimestamp(+new Date());
            var characters = 'abcdefghijklmnopqrstuvwxyz';
            var charactersLength = characters.length;
            var char = characters.charAt(Math.floor(Math.random() * charactersLength));
            setSelectedCharacter(char);
            setAnswersGiven([]); // resetto delle parole inserite
            setCorrectAnswers([]); // reset delle parole corrette
        }
    }, [props.stopRound, props.selectedCategory, props.selectedDifficulty]);

    return (
        <>
            <Container>
                {props.stopRound === false ? <Game timestamp={timestamp} setTimestamp={setTimestamp} selectedCharacter={selectedCharacter} setSelectedCharacter={setSelectedCharacter} answersGiven={answersGiven} setAnswersGiven={setAnswersGiven} setStopRound={props.setStopRound} />
                    : <EndGame answersGiven={answersGiven} setAnswersGiven={setAnswersGiven} setStopRound={props.setStopRound} correctAnswers={correctAnswers} setCorrectAnswers={setCorrectAnswers} user={props.user} selectedCategory={props.selectedCategory}
                        selectedCharacter={selectedCharacter} selectedDifficulty={props.selectedDifficulty} />}
            </Container>
        </>
    )
}
/*************************************** Game e relative funzioni ***************************************/
function Game(props) { // props: timestamp = {timestamp} setTimestamp = {setTimestamp} selectedCharacter = {selectedCharacter} setSelectedCharacter = {setSelectedCharacter} answersGiven = {answersGiven} setAnswersGiven = {setAnswersGiven} setStopRound = {props.setStopRound}

    return (
        <>
            <Row>
                <Col><h5>Lettera: </h5></Col>
                <Col><h5>{props.selectedCharacter}</h5></Col>
            </Row>
            <Row>
                <Col><h5>Timer: </h5></Col>
                <Col>{props.selectedCharacter === '' ? '' : <Timer setStopRound={props.setStopRound} timestamp={props.timestamp} />}</Col>
            </Row>
            <Row>
                <Col><Words answersGiven={props.answersGiven} setAnswersGiven={props.setAnswersGiven} setStopRound={props.setStopRound} selectedCharacter={props.selectedCharacter} /></Col>
            </Row>
        </>
    )
}

function Words(props) { // props: answersGiven = {props.answersGiven} setAnswersGiven = {props.setAnswersGiven} setStopRound = {props.setStopRound}  selectedCharacter = {props.selectedCharacter}

    const [errorMsg, setErrorMsg] = useState('');
    const [text, setText] = useState('');

    const handleEndRound = (event) => {
        event.preventDefault();
        if (props.answersGiven.length === 0)
            setErrorMsg('La risposta non può essere vuota.')
        else
            props.setStopRound(true); // stampo l'endGame ed invio le richieste al server
    }

    const handleAddWord = (event) => { // aggiunge la parola alla lista
        event.preventDefault();
        if (text.trim().length === 0) {
            setErrorMsg('La parola non può essere vuota.')
        } else { // aggiungo la parola alla lista
            if (props.answersGiven.find((element) => element.text.toLowerCase() === text.trim().toLowerCase()))
                setErrorMsg('Parola già inserita')
            else {
                if (!(text.startsWith(props.selectedCharacter) || text.startsWith(props.selectedCharacter.toUpperCase()))) // controllo della lettera minuscola e maiuscola
                    setErrorMsg('La parola non inizia con la lettera data')
                else {
                    props.setAnswersGiven(answersGiven => [...answersGiven, { text: text.trim() }]); // aggiungo il nuovo elemento alla lista
                    setText(''); // settiamo il form vuoto
                }
            }
        }
    }

    return (
        <>
            {errorMsg ? <Alert variant='danger' onClose={() => setErrorMsg('')} dismissible>{errorMsg}</Alert> : false}
            <Container className="m-4">
                <Form>
                    <Form.Group>
                        <Form.Label>Inserisci le parole</Form.Label>
                        <Form.Control value={text} onChange={ev => setText(ev.target.value)}></Form.Control>
                    </Form.Group>
                </Form>
                <Button className="m-1" onClick={handleAddWord}>Aggiungi parola</Button>
                <Button className="m-1" onClick={handleEndRound}>Termina il Round</Button>
                <PrintAnswers correctAnswers={props.answersGiven} tipo={'inserite'} />
            </Container>
        </>
    )
}
/*************************************** EndGame e relative funzioni ***************************************/
function EndGame(props) { // props: answersGiven = {answersGiven} setAnswersGiven = {setAnswersGiven} setStopRound = {props.setStopRound} correctAnswers = {correctAnswers} setCorrectAnswers = {setCorrectAnswers} user = {props.user} selectedCategory = {props.selectedCategory} selectedCharacter = {selectedCharacter} selectedDifficulty = {props.selectedDifficulty} 

    return (
        <>
            {props.correctAnswers.length >= props.selectedDifficulty.d2 ? <PrintRoundPassed correctAnswers={props.correctAnswers} setStopRound={props.setStopRound} user={props.user} setSelectedCharacter={props.setSelectedCharacter} setAnswersGiven={props.setAnswersGiven} />
                : <PrintRoundNotPassed setAnswersGiven={props.setAnswersGiven} setCorrectAnswers={props.setCorrectAnswers} setStopRound={props.setStopRound} setSelectedCharacter={props.setSelectedCharacter} />}
        </>
    )
}

function PrintRoundPassed(props) { // props: setStopRound = {props.setStopRound} round = {props.round} correctAnswers = {props.correctAnswers} 
    return (
        <>
            <Row>
                <Col><h5>Complimenti! Il round è superato.</h5></Col>
            </Row>
            <Row>
                {props.user.CodU === 0 ? '' : <Col><h5>Punteggio: {props.correctAnswers.reduce((acc, ele) => acc + ele.score, 0)}</h5></Col>}
            </Row>
            <Row>
                <Col><PrintAnswers correctAnswers={props.correctAnswers} tipo={'esatte'} /></Col>
            </Row>
            <Row>
                <Col><RestartButton setSelectedCharacter={props.setSelectedCharacter} setAnswersGiven={props.setAnswersGiven} setCorrectAnswers={props.setCorrectAnswers} setStopRound={props.setStopRound} /></Col>
            </Row>
        </>
    )
}

function PrintRoundNotPassed(props) { // props: setAnswersGiven = {props.setAnswersGiven} setCorrectAnswers = {props.setCorrectAnswers} setStopRound = {props.setStopRound} setSelectedCharacter = {props.setSelectedCharacter}
    return (
        <>
            <Row>
                <Col><h5>Riprova! Il round non è superato.</h5></Col>
                <RestartButton setSelectedCharacter={props.setSelectedCharacter} setAnswersGiven={props.setAnswersGiven} setCorrectAnswers={props.setCorrectAnswers} setStopRound={props.setStopRound} />
            </Row>
        </>
    )
}

function PrintAnswers(props) { // props: correctAnswers={props.correctAnswers} tipo = {'esatte'} o tipo = {'date'}
    return ( // stampa tabella risposte esatte o date
        <>
            <Table>
                <thead>
                    <tr>
                        <th>Risposte {props.tipo}</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        props.correctAnswers.map((answer) => <AnswerRow answer={answer} key={answer.text} />)
                    }
                </tbody>
            </Table>
        </>
    )
}

function AnswerRow(props) { // props: answer = {answer} key = {answer.text}
    return ( // stampa riga
        <>
            <tr>
                <td>
                    {props.answer.text}
                </td>
            </tr>
        </>
    );
}

function RestartButton(props) { // setSelectedCharacter = {props.setSelectedCharacter} setAnswersGiven = {props.setAnswersGiven} setCorrectAnswers = {props.setCorrectAnswers} setStopRound = {props.setStopRound}
    const handleButton = (event) => {
        props.setStopRound(false); // fa iniziare il round
    }
    return (
        <>
            <Button className="m-1" onClick={handleButton}>Gioca di nuovo!</Button>
        </>
    )
}

export default GameForm;
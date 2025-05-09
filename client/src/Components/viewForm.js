import { Table, Nav, Container, Row, Col } from 'react-bootstrap';
import GameForm from './gameForm';
import { useState, useEffect } from 'react';
import API from '../API';
import '../custom.css';

function ViewForm(props) { // user.CodU = 0 per utente anonimo, user con CodU e nickname per utente normale

    const [selectedCategory, setSelectedCategory] = useState('');  // animals, nations, colors
    const [selectedDifficulty, setSelectedDifficulty] = useState({ d1: 0, d2: 0 });  // 1, 2, 3, 4
    const [stopRound, setStopRound] = useState(false); // stato per visualizzare la fine del round

    return (
        <>
            <Container>
                <Row className='row vheight-30'>
                    <Col sm={6} className='col-md-6 col-6 below-nav'>
                        <h2>Categoria</h2>
                        <CategorySelection setStopRound={setStopRound} setSelectedCategory={setSelectedCategory} selectedCategory={selectedCategory} />
                    </Col>
                    <Col sm={6} className='col-md-6 col-6 below-nav' >
                        <h2>Difficoltà</h2>
                        <DifficultySelection setStopRound={setStopRound} setSelectedDifficulty={setSelectedDifficulty} selectedDifficulty={selectedDifficulty} />
                    </Col>
                </Row>
                <Row className='row vheight-100'>
                    <Col sm={6} className='col-md-6 col-6'>
                        <h2> Top Player per ogni categoria </h2>
                        <Ranking />
                    </Col>
                    <Col sm={6} className='col-md-6 col-6'>
                        <h2> Gioca il Round </h2>
                        {(selectedCategory === '' || selectedDifficulty.d1 === 0) ? 'Seleziona la categoria e la difficoltà' :
                            <GameForm user={props.user} selectedCategory={selectedCategory} selectedDifficulty={selectedDifficulty}
                                setStopRound={setStopRound} stopRound={stopRound} />}
                    </Col>
                </Row>
            </Container>
        </>
    )
}

function CategorySelection(props) { // props: setStopRound = {setStopRound} setSelectedCategory = {setSelectedCategory} selectedCategory = {selectedCategory}
    return ( // selezione della categoria
        <>
            <Nav defaultActiveKey={`${props.selectedCategory}`} className="flex-column list-group list-group-flush">
                <Nav.Link eventKey="animals" onClick={() => { props.setSelectedCategory("animals"); props.setStopRound(false); }} className="list-group-item list-group-item-action">Animali</Nav.Link>
                <Nav.Link eventKey="nations" onClick={() => { props.setSelectedCategory("nations"); props.setStopRound(false); }} className="list-group-item list-group-item-action">Nazioni</Nav.Link>
                <Nav.Link eventKey="colors" onClick={() => { props.setSelectedCategory("colors"); props.setStopRound(false); }} className="list-group-item list-group-item-action">Colori</Nav.Link>
            </Nav>
        </>
    )
}

function DifficultySelection(props) { // props: setStopRound = {setStopRound} setSelectedDifficulty = {setSelectedDifficulty} selectedDifficulty = {selectedDifficulty}
    return ( // selezione della difficoltà
        <>
            <Nav defaultActiveKey={`${props.selectedDifficulty}`} className="flex-column list-group list-group-flush">
                <Nav.Link eventKey="1" onClick={() => { props.setSelectedDifficulty({ d1: 1, d2: 2 }); props.setStopRound(false); }} className="list-group-item list-group-item-action">Facile</Nav.Link>
                <Nav.Link eventKey="2" onClick={() => { props.setSelectedDifficulty({ d1: 2, d2: 3 }); props.setStopRound(false); }} className="list-group-item list-group-item-action">Media</Nav.Link>
                <Nav.Link eventKey="3" onClick={() => { props.setSelectedDifficulty({ d1: 3, d2: 4 }); props.setStopRound(false); }} className="list-group-item list-group-item-action">Difficile</Nav.Link>
                <Nav.Link eventKey="4" onClick={() => { props.setSelectedDifficulty({ d1: 4, d2: 6 }); props.setStopRound(false); }} className="list-group-item list-group-item-action">Estrema</Nav.Link>
            </Nav>
        </>
    )
}

function Ranking(props) { // Classifica

    const [users, setUsers] = useState([]); // Lista degli utenti con categoria da stampare

    useEffect(() => {
        API.getRankUsers()
            .then((users) => setUsers(users))
            .catch(err => console.log(err))
    }, []); // eseguita solo al primo rendering

    return (
        <>
            <Table>
                <thead>
                    <tr>
                        <th>Nickname</th>
                        <th>Categoria</th>
                        <th>Punteggio</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        users.map((user) => <UserRow key={user.category} user={user} />)
                    }
                </tbody>
            </Table>
        </>
    )
}

function UserRow(props) {
    return (
        <>
            <tr>
                <td>
                    {props.user.nickname}
                </td>
                <td>
                    {props.user.category}
                </td>
                <td>
                    {props.user.score}
                </td>
            </tr>
        </>
    );
}

export default ViewForm;
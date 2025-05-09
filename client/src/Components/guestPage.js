import { Container, Row } from 'react-bootstrap';
import Intestazione from './intestazione';
import ViewForm from './viewForm';
import '../custom.css';

function GuestPage(props) { // user = {user} action = {doGuestOut}

    return (
        <>
            <Container fluid>
                <Row>
                    <Intestazione tipo={'guest'} user={props.user} action={props.action} />
                </Row>
                <ViewForm user={props.user} />
            </Container>
        </>
    )
}

export default GuestPage;
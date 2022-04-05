import Meta from '../components/Meta'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import GoldTokenForm from '../components/GoldTokenForm'

const GoldToken = () => {

  return (
    <div>
      <Meta title="Issue Gold Token"/>
      <h1>Issue Golden Token</h1>
      <Row>
        <Col md={6}>
        <GoldTokenForm />
        </Col>
        <Col>
        <p className='lead'>Golden Ticket will be minted directly to the recipient's wallet.<br/>Only one ticket may be issued per Error Teddy.<br/>Only authorized wallets can perform this function.<br/>
        <br/>If you encounter any error or bugs, contact Xiphiar.
        </p>
        </Col>
      </Row>
    </div>
  )
}

export default GoldToken
import Meta from '../components/Meta'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import MintForm from '../components/MintForm'

const Mint = () => {

  return (
    <div>
      <Meta title="Mint Teddy"/>
      <h1>Mint a Teddy</h1>
      <MintForm />
    </div>
  )
}

export default Mint
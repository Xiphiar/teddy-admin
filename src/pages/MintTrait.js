import Meta from '../components/Meta'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import MintTraitForm from '../components/MintTraitForm'

const MintTrait = () => {

  return (
    <div>
      <Meta title="Mint Trait"/>
      <h1>Mint a 1/1 Trait Teddy</h1>
      <MintTraitForm />
    </div>
  )
}

export default MintTrait
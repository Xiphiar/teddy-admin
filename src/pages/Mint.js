import { useLocation } from 'react-router-dom'

import Meta from '../components/Meta'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import MintForm from '../components/MintForm'

const Mint = () => {
  const location = useLocation()
  const order = location.state?.order || undefined

  return (
    <div>
      <Meta title="Mint Teddy"/>
      <h1>Mint a Teddy</h1>
      <MintForm order={order} />
    </div>
  )
}

export default Mint
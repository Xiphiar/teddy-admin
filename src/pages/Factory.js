import Meta from '../components/Meta'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import OrderModal from '../components/OrderModal'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { getOrdersPermit } from '../utils/keplrHelper'
import { toast } from 'react-toastify'
import { Spinner } from 'react-bootstrap'

const permitName = "MTC-Factory";
const allowedDestinations = ["teddyapi.xiphiar.com", "localhost:9176", 'teddyapi-testnet.xiphiar.com'];

const sleep = duration => new Promise(res => setTimeout(res, duration));

const Factory = () => {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(false)
  const [showIndex, setShowIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getOrders();
  },[])

  useEffect(() => {
    console.log(showIndex);
  },[showIndex])

  const showOrder = (index) => {
    setShowIndex(index);
    setShowModal(true);
  }

  const refresh = async() => {
    getOrders();
    setShowModal(false);
  }

  const getOrders = async() => {
    try{
        setLoading(true);

        //wait for keplr to load before continuing
        let tries = 0
        while (tries < 3){
          if (window.keplr) break;
          await sleep(1000)
          tries++
        }

        if (!window.keplr){
            toast.error('Keplr not found.')
            setLoading(false);
            return;
        }
        await window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
        const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(process.env.REACT_APP_CHAIN_ID);
        const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts();

        const signature = await getOrdersPermit(myAddress, permitName, allowedDestinations)

        var params = new URLSearchParams();
          params.append('permit_name', permitName);
          params.append('allowed_destinations', JSON.stringify(allowedDestinations));
          params.append('signature', JSON.stringify(signature));

        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/factory/orders`,
            params
        );

        console.log(response.data);
        setOrders(response.data.orders);
        setLoading(false)

    } catch(err) {
        console.error(err)
        console.error(err.response?.data?.message || err.message || err);
        alert(err.response?.data?.message || err.message || err);
        setLoading(false);
    }
    };

  return (
    <div>
      <Meta title="MTC Factory Orders"/>
      <OrderModal show={showModal} hide={() => setShowModal(false)} order={orders[showIndex]} refresh={() => refresh()} />
      <h1>Factory Orders</h1>
      <Row>
        <Col md={10}>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Owner</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((v,i) => {
              return(
                <tr key={`factory-table-${i}`}>
                  <td>{v.id}</td>
                  <td>{new Date(v.date).toDateString()}</td>
                  <td>{v.owner}</td>
                  <td><Button onClick={() => showOrder(i)}>View</Button></td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        { loading ?
        <div className='text-center'>
          <Spinner animation="border" variant="primary" />
        </div>
        : null }
        </Col>
      </Row>
    </div>
  )
}

export default Factory
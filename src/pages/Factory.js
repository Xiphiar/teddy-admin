import Meta from '../components/Meta'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import OrderModal from '../components/OrderModal'
import { useEffect, useState } from 'react'
import axios from 'axios'

const permitName = "MTC-Factory";
const allowedDestinations = ["teddyapi.xiphiar.com", "localhost:9176", 'teddyapi-testnet.xiphiar.com'];

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

  const getOrders = async() => {
    try{
        setLoading(true);

        // if (!window.keplr){
        //     alert ("Please install Keplr extension.")
        //     setLoading(false);
        //     return;
        // }

        await window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
        
        const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(process.env.REACT_APP_CHAIN_ID);
        const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts();

        //sign permit
        const permitTx = {
            chain_id: process.env.REACT_APP_CHAIN_ID,
            account_number: "0", // Must be 0
            sequence: "0", // Must be 0
            fee: {
              amount: [{ denom: "uscrt", amount: "0" }], // Must be 0 uscrt
              gas: "1", // Must be 1
            },
            msgs: [
              {
                type: "get_orders", // Must be "query_permit"
                value: {
                  permit_name: permitName,
                  allowed_destinations: allowedDestinations,
                },
              },
            ],
            memo: "" // Must be empty
        }

        const { signature } = await window.keplr.signAmino(
            process.env.REACT_APP_CHAIN_ID,
            myAddress,
            permitTx,
            {
              preferNoSetFee: true, // Fee must be 0, so hide it from the user
              preferNoSetMemo: true, // Memo must be empty, so hide it from the user
            }
        );

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
        //alert(`Success: ${response.data.message}`)


        /*
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
  
        setValidated(true);
        */
    } catch(err) {
        console.error(err.response?.data?.message || err.message || err);
        alert(err.response?.data?.message || err.message || err);
        setLoading(false);
        //throw err.response.statusText;
    }
    };

  return (
    <div>
      <Meta title="MTC Factory Orders"/>
      <OrderModal show={showModal} hide={() => setShowModal(false)} order={orders[showIndex]} />
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
        </Col>
      </Row>
    </div>
  )
}

export default Factory
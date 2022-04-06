import { SecretNetworkClient } from "secretjs";


import React, {useCallback, useState} from 'react'
import axios from 'axios'

import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Image from 'react-bootstrap/Image'

import { BaseDesignSelect } from './BaseDesignSelect';
import FaceSelect from './FaceSelect';
import TraitSelect from './TraitSelect';
import PrivateDropzone from './PrivateDropzone'

import encryptFile from '../utils/encrypt';

const permitName = "MTC-Golden-Token";
const allowedDestinations = ["teddyapi.xiphiar.com", "localhost:9176", 'teddyapi-testnet.xiphiar.com'];
const permissions = ["mint"];

export default function GoldTokenForm() {
    const [validated, setValidated] = useState(false);

    const [teddyId, setTeddyId] = useState("");
    const [recipient, setRecipient] = useState("");
    const [notes, setNotes] = useState("");
    const [privFile, setPrivFile] = useState();

    const handleSubmit = async(event) => {
    try{
        event.preventDefault()
        if (!window.keplr){
            alert ("Please install Keplr extension.")
            return;
        }

        console.log(
            "ID: ", teddyId,
            'Recip', recipient
        )

        //validate input
        if (!recipient) {throw new Error("Please enter a recipient address");}


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
                type: "query_permit", // Must be "query_permit"
                value: {
                  permit_name: permitName,
                  allowed_destinations: allowedDestinations,
                  permissions: permissions,
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


        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/mintGoldToken`,
            {
              with_permit: {
                query: { mint: { nft_id: teddyId, recipient: recipient, notes: notes } },
                permit: {
                  params: {
                    permit_name: permitName,
                    allowed_destinations: allowedDestinations,
                    chain_id: process.env.REACT_APP_CHAIN_ID,
                    permissions: permissions,
                  },
                  signature: signature,
                },
              },
            }
        );

        console.log(response.data);
        alert(`Success: ${response.data.message}`)


        /*
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
  
        setValidated(true);
        */
    } catch(err) {
        console.error(err.response.data.message || err.message);
        alert(err.response.data.message || err.message);
        //throw err.response.statusText;
    }
    };
  
    return (
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="validationCustom01">
            <Form.Label>Teddy ID</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="1234"
              value={teddyId}
              onChange={e => setTeddyId(e.target.value)}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row className="mb-3">
          <Form.Group as={Col} md="8" controlId="validationCustom01">
            <Form.Label>Recipient</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="secret1..."
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
        </Row>
        <Row className="mb-3">
          <Form.Group as={Col} md="8" controlId="validationCustom01">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
        </Row>

        <Button type="submit">Send Token</Button>
      </Form>
    );
}
  
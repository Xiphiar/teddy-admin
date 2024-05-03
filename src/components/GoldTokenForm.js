import { SecretNetworkClient } from "secretjs";

import React, {useCallback, useState} from 'react'
import axios from 'axios'

import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Image from 'react-bootstrap/Image'
import Spinner from 'react-bootstrap/Spinner'

import { BaseDesignSelect } from './BaseDesignSelect';
import FaceSelect from './FaceSelect';
import TraitSelect from './TraitSelect';
import PrivateDropzone from './PrivateDropzone'

import encryptFile from '../utils/encrypt';
import validAddress from '../utils/validAddress';

import {allowedDestinations} from '../constants'

const permitName = "MTC-Golden-Token";
const permissions = ["mint"];

export default function GoldTokenForm() {
    const [validated, setValidated] = useState(false);
    const [loading, setLoading] = useState(false);

    const [teddyId, setTeddyId] = useState("");
    const [recipient, setRecipient] = useState("");
    const [notes, setNotes] = useState("");
    const [privFile, setPrivFile] = useState();

    const handleSubmit = async(event) => {
    try{
        event.preventDefault()
        setLoading(true);

        if (!window.keplr){
            alert ("Please install Keplr extension.")
            setLoading(false);
            return;
        }

        console.log(
            "ID: ", teddyId,
            'Recip', recipient
        )

        //validate input
        if (!recipient) {throw new Error("Please enter a recipient address");}
        if (!validAddress(recipient.trim())) {throw new Error("Recipient address is invalid");}

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
                type: "mint_ticket", // Must be "query_permit"
                value: {
                  permit_name: permitName,
                  allowed_destinations: allowedDestinations,
                  mint_props: {
                    teddy_id: teddyId,
                    recipient: recipient.trim()
                  }
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
          params.append('nft_id', teddyId);
          params.append('recipient', recipient.trim());
          params.append('notes', notes);

        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/mintGoldToken`,
            params
        );

        console.log(response.data);
        setLoading(false)
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
        console.error(err.response?.data?.message || err.message || err);
        alert(err.response?.data?.message || err.message || err);
        setLoading(false);
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
              onChange={e => setRecipient(e.target.value.trim())}
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
      { loading ?
        <Button  disabled={loading} type="submit">
          <Spinner
            as="span"
            animation="grow"
            size="sm"
            role="status"
            aria-hidden="true"
          />
          Loading...
        </Button>
      :
        <Button type="submit" disabled={loading}>Send Token</Button>
      }
      </Form>
    );
}
  
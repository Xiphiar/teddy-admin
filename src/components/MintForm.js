import { SecretNetworkClient } from "secretjs";


import React, {useCallback, useState} from 'react'
import {useDropzone} from 'react-dropzone'

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
import addPulsar from "../utils/addPulsar";

const faces = [
    'Aint no snitch',
    'Angry',
    'Confused',
    'Dead serious',
    'Evil',
    'Happy',
    'Shocked',
    'Smug',
    'Teddy Smile'    
]

const colors = ['Baby Blue',
    'Black',
    'Blood Stained',
    'Cheetah print',
    'Gold',
    'Orange',
    'Panda',
    'Polar',
    'Purple',
    'Radioactive - Green',
    'Radioactive - Pink',
    'Red',
    'Standard brown',
    'Tartan',
    "This isn't the standard brown.. Promise",
    'Tiger stripes']

const backgrounds = ['AlterDapp Maxi',
    'Baby degens',
    'Bitcoin Maxi',
    'Cobweb',
    'Cosmos Maxi',
    'Ethereum Maxi',
    'Ew!',
    "I don't need a professional",
    'LUNA Maxi',
    "Needs patchin' up",
    'No more nightmares',
    'Secret Maxi',
    'Terra Maxi',
    'To do List',
    'Turn me on',
    'Wall plant',
    "We're watching you",
    'Wen mint?',
    'Wen moon',]

const hands = [
    'A little off the top',
    'Airstrike inbound',
    'Alpha Pouch',
    'am Gucci',
    'Attitude adjusters',
    'Chainsaw',
    'Crowd pleaser',
    'Flame on',
    'Gameboy',
    'German piano',
    'Going somewhere?',
    'Got Bank',
    'Midnight raver',
    'Midnight raver + Nunchuck',
    'Mini Uzi',
    'Mini Uzi + Got Bank',
    'Mini-Me',
    'Mini-Me + A sharp instrument',
    'Mini-Me + am gucci',
    'Mini-Me + chainsaw',
    'Mini-Me + crowd pleaser',
    'Mini-Me + flame on',
    'Mini-Me + Gameboy',
    'Mini-Me + Gamerboy',
    'Mini-Me + German Piano',
    'Mini-Me + going somewhere',
    'Mini-Me + mini uzi',
    'Mini-Me + RPG',
    'Mini-Me + Sai swords',
    'Mini-Me + This is my boom-stick!',
    'Mini-Me + where them diamond at',
    'Mini-Me + where them diamonds at',
    'Mini-Me + WTF',
    'Mini-Me + WTF!',
    'Mini-uzi',
    'New wave axe',
    'Nunchuck',
    'Persuader',
    'RPG',
    'Sai Swords',
    'Samari Sword',
    'Sharp instrument',
    'This is my boom-stick!',
    'Whale Wallet',
    'Where them diamonds at?',
    'WTF'
]

const heads = [
    'ATOM Cap',
    'Balaclava',
    'BSC Cap',
    'Crocodile dundee hat',
    'ETH Cap',
    'For Valhalllla!',
    'Gasmask',
    'Gasmask + Ooorah!',
    'Gasmask + Yeeehaaw!',
    'LUNA Cap',
    'Oorah!',
    'OSMO Cap',
    'Party Hat',
    'Red Bandana',
    'Red Mohawk',
    'SCRT Cap',
    'SCRT YeeeHaaw!',
    'Sneeze stopper',
    'Sneeze stopper + SCRT branded hat',
    'Squid Game Mask',
    'Squid Game Mask + take-off',
    'Take-off',
    'Terra Cap',
    'The Donald',
    'The hunter',
    'YeeeHaaw!'
]

const bodys = [
    'ATOM Enthusiast',
    'ATOM Hoodie',
    'Black Hoodie Enthusiast',
    'Black shirt enthusiast',
    'BSC Enthusiast',
    'BSC Hoodie',
    'Builder Bear',
    'Christmas is just around the corner',
    'ETH Enthusiast',
    'ETH Hoodie',
    'Grease monkey',
    'I <3 MUM Tattoo',
    'Its chinchilla darling',
    'LUNA Enthusiast',
    'LUNA Hoodie',
    'OSMO Enthusiast',
    'OSMO Hoodie',
    'SCRT Enthusiast',
    'SCRT Hoodie',
    "Trust me, I'm a doctor",
]

const eyewears = [
    '3D Glasses',
    'BTC Pew! Pew!',
    'Cyborg eye',
    'Cyclopes sunglasses',
    'Grouchio Marx',
    "I'm legally blind",
    'Monocle',
    'Not a real ninja',
    'Oo a pineapple',
    'Pew! Pew!',
    'Steampunk Glasses',
    'Sunny out',
    'What do you call a fish with one eye?',
]

export default function MintForm() {
    const [validated, setValidated] = useState(false);

    const [teddyId, setTeddyId] = useState("");
    const [pubImage, setPubImage] = useState();
    const [privFile, setPrivFile] = useState();
    const [baseDesign, setBaseDesign] = useState();
    const [pubBaseDesign, setPubBaseDesign] = useState();

    const [face, setFace] = useState();
    const [color, setColor] = useState();
    const [background, setBackground] = useState();
    const [hand, setHand] = useState();
    const [head, setHead] = useState();
    const [body, setBody] = useState();
    const [eyewear, setEyewear] = useState();
    
    const changeBaseDesign = (input) => {
        switch(input){
            case 'Ro-Bear':
                setPubImage('https://arweave.net/9JmggQG3JV5eLFZdvBfL3Vk7APLOmgN_WK4km7qq7fE');
                setPubBaseDesign('Ro-Bear');
                break;
            case 'Zom-Bear':
                setPubImage('https://arweave.net/X2nzHkuIKvtucDp1UhxuHjS2OgwhyqF3wKS0U4gBlpk');
                setPubBaseDesign('Zom-Bear');
                break;
            default:
                setPubImage('https://arweave.net/0ZP_yaIeYc4vGwMxqoJdqgOGKjZpspl7ktGUmUvNee4');
                setPubBaseDesign('Teddy-bear');
                break;
        }
        setBaseDesign(input);
    }

    const handleSubmit = async(event) => {
        event.preventDefault()
        if (!window.keplr){
            alert ("Please install Keplr extension.")
            return;
        }

        console.log(
            "ID: ", teddyId,
            "Pub Image: ", pubImage,
            'Base Design: ', baseDesign,
            'Facial Expression: ', face,
            'Bear Color: ', color,
            'Priv File', privFile
        )
        if (process.env.REACT_APP_CHAIN_ID.includes("pulsar")) addPulsar();
        await window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
        const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(process.env.REACT_APP_CHAIN_ID,);
        const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts();

        console.log(process.env.REACT_APP_GRPC_URL)
        const secretjs = await SecretNetworkClient.create({
            grpcWebUrl: process.env.REACT_APP_GRPC_URL,
            chainId: process.env.REACT_APP_CHAIN_ID,
            wallet: keplrOfflineSigner,
            walletAddress: myAddress,
            encryptionUtils: window.getEnigmaUtils(process.env.REACT_APP_CHAIN_ID,),
        });

        //validate input
        if (!baseDesign) {throw new Error("no base Design selected");}

        const {hash, key} = await encryptFile(privFile);
        console.log(hash, key);

        let privAttributes = [
            {
                trait_type: "Base Design",
                value: baseDesign.trim()
            }
        ]

        let pubAttributes = [
            {
                trait_type: "Base Design",
                value: pubBaseDesign.trim()
            }
        ]

        if(face) privAttributes.push({
            trait_type: "Face",
            value: face.trim()
        })

        if(color) privAttributes.push({
            trait_type: "Color",
            value: color.trim()
        })

        if(background) privAttributes.push({
            trait_type: "Background",
            value: background.trim()
        })

        if(hand) privAttributes.push({
            trait_type: "Hand",
            value: hand.trim()
        })

        if(head) privAttributes.push({
            trait_type: "Head",
            value: head.trim()
        })

        if(body) privAttributes.push({
            trait_type: "Body",
            value: body.trim()
        })

        const mintMsg = {
            mint_mutant: {
                token_id:teddyId.toString().trim(),
                public_metadata: {
                    extension: {
                        name: teddyId.toString().trim(),
                        attributes: pubAttributes,
                        image: pubImage,
                    }
                },
                private_metadata: {
                    extension: {
                        attributes: privAttributes,
                        name: teddyId.toString().trim(),
                        media: [{
                            authentication: {key: key},
                            extension: 'png',
                            file_type: 'image',
                            url: `https://ipfs.io/ipfs/${hash}`,
                        }]
                    }
                },
            }
        } 
        console.log({
            sender: myAddress,
            contract: process.env.REACT_APP_NFT_ADDRESS,
            codeHash: process.env.REACT_APP_NFT_HASH, // optional but way faster
            msg: mintMsg,
          })
        try {
        const tx = await secretjs.tx.compute.executeContract(
            {
              sender: myAddress,
              contract: process.env.REACT_APP_NFT_ADDRESS,
              codeHash: process.env.REACT_APP_NFT_HASH, // optional but way faster
              msg: mintMsg,
            },
            {
              gasLimit: 100_000,
            },
          );

        console.log(tx)
        } catch (err) {
            console.log(err)
        }
        /*
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
  
        setValidated(true);
        */
    };
  
    return (
    <Row>
    <Col md="6">
      <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="validationCustom01">
            <Form.Label>New ID</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="1234"
              value={teddyId}
              onChange={e => setTeddyId(e.target.value)}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>

          <BaseDesignSelect baseDesign={baseDesign} setBaseDesign={changeBaseDesign}/>
        </Row>

        
        <TraitSelect value={face} set={setFace} label="Facial Expression" options={faces}/>
        <TraitSelect value={color} set={setColor} label="Bear Color" options={colors}/>
        <TraitSelect value={background} set={setBackground} label="Background" options={backgrounds}/>
        <TraitSelect value={hand} set={setHand} label="Held in Hand" options={hands}/>
        <TraitSelect value={head} set={setHead} label="On Head" options={heads}/>
        <TraitSelect value={body} set={setBody} label="On Body" options={bodys}/>
        <TraitSelect value={eyewear} set={setEyewear} label="Eyewear" options={eyewears}/>

        <Button type="submit">Submit form</Button>
      </Form>
    </Col>
    <Col md="4">
    <div style={{marginBottom: "40px"}}>
        <h3>Public Image</h3>
        { pubImage ?
            <Image src={pubImage} fluid style={{height: "300px"}}/>
        :
            <p>
                Select a Base Design
            </p>
        }
        <br/>
        <em>Will update automatically to match Base Design.</em>
    </div>

    <div>
       <h3>Private Image</h3>
        <PrivateDropzone set={setPrivFile}/>
    </div>
    </Col>
    </Row>
    );
}
  
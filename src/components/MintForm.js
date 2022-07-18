import { MsgExecuteContract, SecretNetworkClient } from "secretjs";

import React, {useCallback, useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import {useDropzone} from 'react-dropzone'

import { toast } from 'react-toastify';

import axios from 'axios';

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
import addPulsar from "../utils/addPulsar";
import tryNTimes from "../utils/tryNTimes";
import { PubImageSelect } from "./PubImageSelect";
import { queryTokenMetadata } from "../utils/dataHelper"
import { getPermit } from "../utils/keplrHelper";

const permitName = "MTC-Mint-Teddy";
const allowedDestinations = ["teddyapi.xiphiar.com", "localhost:9176", 'teddyapi-testnet.xiphiar.com'];

const pubBaseDesigns = [
    { type: "teddy", name: 'Teddy-bear', url: "https://arweave.net/0ZP_yaIeYc4vGwMxqoJdqgOGKjZpspl7ktGUmUvNee4"},
    { type: "robot", name: 'Ro-Bear', url: "https://arweave.net/9JmggQG3JV5eLFZdvBfL3Vk7APLOmgN_WK4km7qq7fE"},
    { type: "zombie", name: 'Zom-Bear', url: "https://arweave.net/X2nzHkuIKvtucDp1UhxuHjS2OgwhyqF3wKS0U4gBlpk"}
]

const extraPubImages = [
    { name: 'Factory', url: "https://arweave.net/-Qe3YXsw5xAyCP-ZizCHSMhTiG-yN8H3VYnphbmCjK8"},
    { name: 'Error', url: "https://arweave.net/FqTDF4Iq4Axtuv6ZG8thWrMUggx6GIcHqL-PJPJ0MfY"}
]

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

export default function MintForm({order}) {
    const [loading, setLoading] = useState(false);

    const [teddyId, setTeddyId] = useState("");
    const [teddyName, setTeddyName] = useState(order.name || '')
    const [recipient, setRecipient] = useState(order.owner || '')

    const [pubImage, setPubImage] = useState();
    const [pubImageOptions, setPubImageOptions] = useState([]);
    const [privFile, setPrivFile] = useState();
    const [baseDesign, setBaseDesign] = useState();
    const [pubBaseDesign, setPubBaseDesign] = useState();
    const [daoValue, setDaoValue] = useState("");

    const [face, setFace] = useState(order?.final_face);
    const [color, setColor] = useState(order?.final_color);
    const [background, setBackground] = useState(order?.final_background);
    const [hand, setHand] = useState(order?.final_hand);
    const [head, setHead] = useState(order?.final_head);
    const [body, setBody] = useState(order?.final_body);
    const [eyewear, setEyewear] = useState(order?.final_eyewear);

    let navigate = useNavigate();

    useEffect(()=>{
        if (order){
            console.log(order);
            changeBaseDesign(order.final_base)
            setPubImage(extraPubImages.find(v=>v.name==='Factory').url)
        }
    },[order])



    const errorToast = (message = 'Error occured, please check the console.') => {
        setLoading(false);
        toast(
            message,
            {
                type: "error"
            }
        )
    }
    
    const changeBaseDesign = (input) => {
        switch(input){
            case 'Ro-Bear':
                const roData = pubBaseDesigns.find((design) => design.type === 'robot');
                setPubImageOptions([
                    roData,
                    ...extraPubImages
                ])
                setPubBaseDesign(roData.name);
                break;
            case 'Zom-Bear':
                const zomData = pubBaseDesigns.find((design) => design.type === 'zombie');
                setPubImageOptions([
                    zomData,
                    ...extraPubImages
                ])
                setPubBaseDesign(zomData.name);
                break;
            case '':
                //setPubImage();
                setPubImageOptions([])
                setPubBaseDesign();
                break;
            default:
                const tedData = pubBaseDesigns.find((design) => design.type === 'teddy');
                setPubImageOptions([
                    tedData,
                    ...extraPubImages
                ])
                setPubBaseDesign(tedData.name);
                break;
        }
        setBaseDesign(input);
    }

    const handleSubmit = async(event) => {
    try {
        event.preventDefault()
        setLoading(true)

        if (!window.keplr){
            setLoading(false)
            alert ("Please install Keplr extension.")
            return;
        }

        //debug logging
        console.log("Teddy Mint Info",{
            "ID": teddyId,
            "Pub Image": pubImage,
            'Base Design': baseDesign,
            'Facial Expression': face,
            Background: background,
            Hand: hand,
            Head: head,
            Body: body,
            Eyewear: eyewear,
            'Color': color,
            'Priv File': privFile
        })

        // connect Keplr and create signing secretjs client
        if (process.env.REACT_APP_CHAIN_ID.includes("pulsar")) addPulsar();
        await window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
        const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(process.env.REACT_APP_CHAIN_ID,);
        const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts();

        const secretjs = await SecretNetworkClient.create({
            grpcWebUrl: process.env.REACT_APP_GRPC_URL,
            chainId: process.env.REACT_APP_CHAIN_ID,
            wallet: keplrOfflineSigner,
            walletAddress: myAddress,
            encryptionUtils: window.getEnigmaUtils(process.env.REACT_APP_CHAIN_ID,),
        });

        //validate input
        if (!baseDesign) {return errorToast("No Base Design selected");}
        if (!privFile) {return errorToast("No Private Image Uploaded");}
        if (!teddyId || teddyId.length>8) return errorToast("Teddy ID must be less than 8 characters.");

        // validate ID is available in database
        const {data: dbresponse} = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/teddy/${teddyId.trim()}`)
        if (dbresponse.id) return errorToast(`ID ${teddyId} already exists in database.`);

        // validate ID is Available on chain
        const {nft_dossier} = await secretjs.query.compute.queryContract({
            contractAddress: process.env.REACT_APP_NFT_ADDRESS,
            codeHash: process.env.REACT_APP_NFT_HASH,
            query: {
                nft_dossier: {
                    token_id: teddyId
                }
            }
        })
        if (nft_dossier)  return errorToast(`ID ${teddyId} already exists in contract.`);

        //encrypt file
        const encryptPromise = encryptFile(privFile, teddyId);
        toast.promise(
            encryptPromise,
            {
              pending: 'Image Encrypting...',
              success: 'Image Encrypted 👌',
              error: 'Failed to encrypt image'
            }
        )
        const {hash, key} = await encryptPromise;
        console.log("Image Upload: ",
            {Hash: hash, Key: key}
        );

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

        if(eyewear) privAttributes.push({
            trait_type: "Eyewear",
            value: eyewear.trim()
        })

        // handle message to execute on the contract
        const mintMsg = {
            mint_mutant: {
                token_id:teddyId.toString().trim(),
                public_metadata: {
                    extension: {
                        name: teddyName.toString().trim() || teddyId.toString().trim(),
                        attributes: pubAttributes,
                        image: pubImage,
                    }
                },
                private_metadata: {
                    extension: {
                        attributes: privAttributes,
                        name: teddyName.toString().trim() || teddyId.toString().trim(),
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

        const mintTx = new MsgExecuteContract({
            sender: myAddress,
            contractAddress: process.env.REACT_APP_NFT_ADDRESS,
            codeHash: process.env.REACT_APP_NFT_HASH, // optional but way faster
            msg: mintMsg
        })

        // debug logging
        console.log("TX Info: ",mintTx)

        //prepare xfer TX
        const xferTx = new MsgExecuteContract({
            sender: myAddress,
            contractAddress: process.env.REACT_APP_NFT_ADDRESS,
            codeHash: process.env.REACT_APP_NFT_HASH, // optional but way faster
            msg: {
                transfer_nft: {
                    recipient: recipient,
                    token_id: teddyId.toString().trim()
                }
            }
        })

        //prepare swap metadata txs
        const txToast = toast.loading("Waiting for Permit...")

        const qpSignature = await getPermit(myAddress);

        toast.update(txToast, { render: "Preparing..." });

        const data = await Promise.all([
            queryTokenMetadata(secretjs, order.teddy1.toString(), qpSignature),
            queryTokenMetadata(secretjs, order.teddy2.toString(), qpSignature),
            queryTokenMetadata(secretjs, order.teddy3.toString(), qpSignature)
        ])
        if (data.find(v=>v.nft_dossier.display_private_metadata_error!==null)) throw new Error(`You do not have access to the private metadata of a teddy in this order.`)

        const tokenIds = [order.teddy1.toString(),order.teddy2.toString(),order.teddy3.toString()];
        const swapTxs = [];

        for (let i=0; i < data.length; i++) {
            const metadata = data[i].nft_dossier;
            console.log(metadata);

            if (metadata.private_metadata.extension.media) {
                //we need to swap
                swapTxs.push(new MsgExecuteContract({
                    sender: myAddress,
                    contractAddress: process.env.REACT_APP_NFT_ADDRESS,
                    codeHash: process.env.REACT_APP_NFT_HASH, // optional but way faster
                    msg: {
                        to_pub: {
                            token_id: tokenIds[i]
                        }
                    }
                }))
            }
        }
        console.log(swapTxs);

        //pprepare burn TX
        const burnTx = new MsgExecuteContract({
            sender: myAddress,
            contractAddress: process.env.REACT_APP_NFT_ADDRESS,
            codeHash: process.env.REACT_APP_NFT_HASH, // optional but way faster
            msg: {
                batch_transfer_nft: {
                    transfers: [
                        {
                            recipient: process.env.REACT_APP_MT_DOOM_ADDR,
                            token_ids: [order.teddy1, order.teddy2, order.teddy3]
                        }
                    ]

                }
            }
        })


        // execute TXs
        //const txToast = toast.loading("Transaction Pending...")
        toast.update(txToast, { render: "Transaction Pending..." })
        const tx = await secretjs.tx.broadcast([...swapTxs, mintTx, xferTx, burnTx],
            {
                gasLimit: 250_000,
            },
        ).catch(e=> toast.update(txToast, { render: "Transaction Failed", type: "error", isLoading: false, autoClose: 5000 }) );

        console.log('*TX*',tx)

        if (tx.code) {
            toast.update(txToast, { render: "Transaction Failed", type: "error", isLoading: false, autoClose: 5000 });
            throw new Error(tx.rawLog)
        }

        toast.update(txToast, { render: "Transaction Processed", type: "success", isLoading: false, autoClose: 5000 });


        //sign permit
        // permit is used to authenticate API
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
                type: "add_teddy", // Must be "query_permit"
                value: {
                  permit_name: permitName,
                  allowed_destinations: allowedDestinations,
                  mint_props: {
                    nft_id: teddyId.toString(),
                    base_design: baseDesign,
                    face: face || null,
                    color: color || null,
                    background: background || null,
                    hand: hand || null,
                    head: head || null,
                    body: body || null,
                    eyewear: eyewear || null,
                    pub_url: pubImage,
                    dao_value: daoValue,
                    "1of1": 0,
                    order: {
                        id: order.id,
                        teddies: [order.teddy1, order.teddy2, order.teddy3]
                    }
                  }
                },
              },
            ],
            memo: "" // Must be empty
        }
        console.log("Unsigned: ", JSON.stringify(permitTx,undefined,2))

        const signature = await tryNTimes({
            times: 3,
            toTry: async() => {
                const {signature} = await window.keplr.signAmino(
                    process.env.REACT_APP_CHAIN_ID,
                    myAddress,
                    permitTx,
                    {
                      preferNoSetFee: true, // Fee must be 0, so hide it from the user
                      preferNoSetMemo: true, // Memo must be empty, so hide it from the user
                    }
                );
                return signature
            },
            onErr: async(error) => {
                console.error("Permit signing error: ", error)
                alert('Error: Failed to sign permit.\nPlease close any Keplr windows and click OK to try again.\nYou must accept this request to add the new teddy to the rarity database!')
                return true
            }
        })
        console.log(signature)


        // new teddy data for backend API
        var params = new URLSearchParams();
          params.append('permit_name', permitName);
          params.append('allowed_destinations', JSON.stringify(allowedDestinations));
          params.append('signature', JSON.stringify(signature));
          params.append('nft_id', teddyId.trim());
          params.append('base_design', baseDesign.trim());
          if (face) params.append('face', face.trim());
          if (color) params.append('color', color.trim());
          if (background) params.append('background', background.trim());
          if (hand) params.append('hand', hand.trim());
          if (head) params.append('head', head.trim());
          if (body) params.append('body', body.trim());
          if (eyewear) params.append('eyewear', eyewear.trim());
          params.append('pub_url', pubImage.trim());
          params.append('dao_value', daoValue.trim());
          params.append('1of1', 0);
          params.append('order', JSON.stringify(order));

        const response = await toast.promise(
            axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/addData`,
                params
            ).catch(err => {
                console.error(err.response?.data?.message || err.message || err)
                throw new Error(err.response?.data?.message || err.message || err)
            }),
            {
            pending: 'Adding to Database...',
            success: 'Added to Database',
            error: 'Failed to add to database'
            }
        )
        console.log(response.data);

        setLoading(false)
        alert(`Success: ${response.data.message}`)
        navigate('/factory')
    } catch(err) {
        errorToast();
        console.error(err);
        setLoading(false);
        alert(`${err}\n\nIf you think a teddy was minted, or are unsure if one was, please contact Xiphiar.\nOtherwise you can try again.\nInclude any information in the console (press F12, do not refresh the page)`)
    }
    };


  console.log('render form')
    return (
    <Row>
    <Col md="6">
        <Form onSubmit={handleSubmit}>
        <Row className="mb-3">
            <Form.Group as={Col} md="12" controlId="validationCustom01">
                <Form.Label>Recipient</Form.Label>
                <Form.Control
                type="text"
                placeholder=""
                value={recipient}
                disabled={true}
                onChange={e => setRecipient(e.target.value)}
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            </Form.Group>
        </Row>
        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="validationCustom01">
            <Form.Label>New ID</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="1234"
              value={teddyId}
              onChange={e => setTeddyId(e.target.value.trim())}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
    
          <BaseDesignSelect baseDesign={baseDesign} setBaseDesign={changeBaseDesign}/>
        </Row>
        <Row className="mb-3">
            <Form.Group as={Col} md="8" controlId="validationCustom01">
                <Form.Label>Teddy Name</Form.Label>
                <Form.Control
                type="text"
                placeholder=""
                value={teddyName}
                //disabled={true}
                onChange={e => setTeddyName(e.target.value)}
                />
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            </Form.Group>
        </Row>



        
        <TraitSelect value={face} set={setFace} label="Facial Expression" options={faces}/>
        <TraitSelect value={color} set={setColor} label="Bear Color" options={colors}/>
        <TraitSelect value={background} set={setBackground} label="Background" options={backgrounds}/>
        <TraitSelect value={hand} set={setHand} label="Held in Hand" options={hands}/>
        <TraitSelect value={head} set={setHead} label="On Head" options={heads}/>
        <TraitSelect value={body} set={setBody} label="On Body" options={bodys}/>
        <TraitSelect value={eyewear} set={setEyewear} label="Eyewear" options={eyewears}/>
        <Form.Group as={Col} md="4" controlId="validationCustom01">
            <Form.Label>DAO Value</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder="21"
              value={daoValue}
              onChange={e => setDaoValue(e.target.value)}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
        </Form.Group>

        <br />
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
            <Button type="submit" disabled={loading}>Mint Teddy</Button>
        }
      </Form>
    </Col>
    <Col md="4">
    <div style={{marginBottom: "40px"}}>
        <h3>Public Image</h3>
        { pubImage ?
            <Image src={pubImage} fluid style={{height: "300px"}}/>
        :
            <p>
                Select a Base Design and Public Image
            </p>
        }
        <br/><br/>
        <PubImageSelect value={pubImage} set={setPubImage} options={pubImageOptions} />
        <em>Available options are based on Base Design.</em>
    </div>

    <div>
       <h3>Private Image</h3>
        <PrivateDropzone set={setPrivFile}/>
    </div>
    </Col>
    </Row>
    );
}
  
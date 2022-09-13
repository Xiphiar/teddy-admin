import React, {useState,useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import { grpc } from "@improbable-eng/grpc-web";

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { getPermit } from "../utils/keplrHelper";
import { queryTokenHistory, queryGoldTokenHistory, queryTokenMetadata, queryOwnedTickets, queryOwnedTokens } from '../utils/dataHelper'
import { SecretNetworkClient } from 'secretjs';
import { Spinner } from 'react-bootstrap';
import FactoryTeddyCard from './FactoryTeddyCard'
import { toast } from 'react-toastify';
import { MsgExecuteContract } from 'secretjs';
import tryNTimes from "../utils/tryNTimes";
import axios from 'axios';
import { sleep } from '../utils/keplrHelper';

const permitName = "MTC-Cancel-Order";
const allowedDestinations = ["teddyapi.xiphiar.com", "localhost:9176", 'teddyapi-testnet.xiphiar.com'];

//export default class OrderModal extends React.Component {
export default function OrderModal(props){
    // constructor(props) {
    //   super(props);
    //   this.state = {
    //     show: this.props.show || false,
    //     secretJs: this.props.secretJs,
    //     address: this.props.address,
    //     order: this.props.order || {},
    //     view: false,
    //     teddyData: [],
    //     history: props.history
    //   };
    // }
    const [show, setShow] = useState(props.show || false);
    const [order, setOrder] = useState(props.order || undefined);
    const [view, setView] = useState(false);
    const [teddyData, setTeddyData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMint, setLoadingMint] = useState(false);
    const [loadingCancel, setLoadingCancel] = useState(false);
    const [verified, setVerified] = useState(false);
    //const [history, setHistory] = useState();
    let navigate = useNavigate();

    useEffect(()=>{
        setShow(props.show);
    },[props.show])

    useEffect(()=>{
        setOrder(props.order);
        setVerified(false);
        setTeddyData([]);
        setLoading(false);
        setLoadingCancel(false);
        setLoadingMint(false);
        setView(false);
    },[props.order])

    let queryJs = undefined
    let signerJs = undefined
    let signature = undefined
    let walletAddress = undefined

    // function componentDidUpdate(prevProps){
    //     if (this.props !== prevProps) {
    //         this.setState({
    //             show: this.props.show || false,
    //             order: this.props.order || {}
    //         })
    //     }
    // }

    const setupQueryJs = async() => {
        if (!queryJs) queryJs = await SecretNetworkClient.create({
            grpcWebUrl: process.env.REACT_APP_GRPC_URL,
            chainId: process.env.REACT_APP_CHAIN_ID,
        });
    }

    const setupSignerJs = async() => {
        if (!signerJs) {
            await window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
            const keplrOfflineSigner = window.getOfflineSignerOnlyAmino(process.env.REACT_APP_CHAIN_ID);
            const [{ address: myAddress }] = await keplrOfflineSigner.getAccounts();
    
            signerJs = await SecretNetworkClient.create({
                grpcWebUrl: process.env.REACT_APP_GRPC_URL,
                chainId: process.env.REACT_APP_CHAIN_ID,
                wallet: keplrOfflineSigner,
                walletAddress: myAddress,
                encryptionUtils: window.getEnigmaUtils(process.env.REACT_APP_CHAIN_ID),
            });
            walletAddress = myAddress;
        }
    }

    const setupPermit = async() => {
        if (!signature || !walletAddress) {
            window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
            const offlineSigner = window.getOfflineSigner(process.env.REACT_APP_CHAIN_ID);
            const accounts = await offlineSigner.getAccounts();
            signature = await getPermit(accounts[0].address);
            walletAddress = accounts[0].address;
        }
    }


    const viewTeddies = async() => {
        try {
            setView(true);

            await setupQueryJs();
            await setupPermit();
        
            //query all metadata
            const data = await Promise.all([
                queryTokenMetadata(queryJs, order.teddy1.toString(), signature),
                queryTokenMetadata(queryJs, order.teddy2.toString(), signature),
                queryTokenMetadata(queryJs, order.teddy3.toString(), signature)
            ])
            console.log(data[0], data[1], data[2]);
            if (data.find(v=>v.nft_dossier.display_private_metadata_error!==null)) throw new Error(`You do not have access to the private metadata of a teddy in this order.`)
            setTeddyData(data);
        } catch(e){
            alert(`Problem getting teddy data. Are you connected with the admin wallet?\n${e}`)
            setView(false);
        }

    }

    const handleCancel = async() => {
        setLoadingCancel(true);

        await setupSignerJs();

        try {
            let isVerified = verified;
            if (!isVerified) isVerified = await handleVerify();
            
        } catch(e) {
            console.error(e)
            alert(`Failed to verify order! Are connected with the Admin wallet?\nError: ${e}`)
            setLoading(false);
            setLoadingCancel(true);
            return;
        }

        try {
            const returnTx = new MsgExecuteContract({
                sender: walletAddress,
                contractAddress: process.env.REACT_APP_NFT_ADDRESS,
                codeHash: process.env.REACT_APP_NFT_HASH, // optional but way faster
                msg: {
                    batch_transfer_nft: {
                        transfers: [
                            {
                                recipient: order.owner,
                                token_ids: [order.teddy1.toString(), order.teddy2.toString(), order.teddy3.toString()],
                                memo: "Canceled MTC Factory Order"
                            }
                        ]
    
                    }
                }
            })

            let paymentReturnTx;

            if (order.goldToken) {
                // prepare token return TX
                paymentReturnTx = new MsgExecuteContract({
                    sender: walletAddress,
                    contractAddress: process.env.REACT_APP_TICKET_ADDRESS,
                    codeHash: process.env.REACT_APP_TICKET_HASH, // optional but way faster
                    msg: {
                        transfer_nft: {
                            recipient: order.owner,
                            token_id: order.goldToken.toString(),
                            memo: "Canceled MTC Factory Order"
                        }
                    }
                })
            } else {
                // prepare sSCRT return TX
                paymentReturnTx = new MsgExecuteContract({
                    sender: walletAddress,
                    contractAddress: process.env.REACT_APP_TOKEN_ADDRESS,
                    codeHash: process.env.REACT_APP_TOKEN_HASH, // optional but way faster
                    msg: {
                        transfer: {
                            recipient: order.owner,
                            amount: "5000000"
                        }
                    }
                })
            }


            // execute TXs
            const txToast = toast.loading("Transaction Pending...")

            const tx = await signerJs.tx.broadcast([returnTx, paymentReturnTx],
                {
                    gasLimit: 200_000,
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
                    type: "cancel_order", // Must be "query_permit"
                    value: {
                        permit_name: permitName,
                        allowed_destinations: allowedDestinations,
                        cancel_props: {
                            order_id: order.id,
                            return_hash: tx.transactionHash,
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
                        walletAddress,
                        permitTx,
                        {
                        preferNoSetFee: true, // Fee must be 0, so hide it from the user
                        preferNoSetMemo: true, // Memo must be empty, so hide it from the user
                        }
                    );
                    await sleep(100);
                    return signature;
                },
                onErr: async(error) => {
                    console.error("Permit signing error: ", error)
                    alert('Error: Failed to sign permit.\nPlease close any Keplr windows and click OK to try again.\nYou must accept this request to update the order database!')
                    return true
                }
            })
            console.log(signature)


            // new teddy data for backend API
            var params = new URLSearchParams();
            params.append('permit_name', permitName);
            params.append('allowed_destinations', JSON.stringify(allowedDestinations));
            params.append('signature', JSON.stringify(signature));
            params.append('order_id', order.id);
            params.append('return_hash', tx.transactionHash.trim());

            const response = await toast.promise(
                axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/factory/cancel`,
                    params
                ).catch(err => {
                    console.error(err.response?.data?.message || err.message || err)
                    throw new Error(err.response?.data?.message || err.message || err)
                }),
                {
                pending: 'Canceling Order...',
                success: 'Order Canceled',
                error: 'Failed to update database'
                }
            )
            console.log(response.data);

            setLoading(false)
            alert(`Success: ${response.data.message}`)

            props.refresh();

        } catch (error) {
            alert(`Problem returning teddies. Are you connected with the admin wallet?\n${error}`)
        }
    };

    const handleVerify = async() => {
        try {
            setLoading('Getting Permit...');
            await setupQueryJs();
            await setupPermit();
            if (walletAddress !== 'secret1s7hqr22y5unhsc9r4ddnj049ltn9sa9pt55nzz') throw new Error(`You are not connected with the Admin wallet.`);

            const ids = [order.teddy1.toString(),order.teddy2.toString(),order.teddy3.toString()]

        //--- verify tx hash ---//
            setLoading('Verifying Transaction...');
            console.log('*TX Hash*', order.tx_hash);
            //const tx = await queryJs.query.getTx(order.tx_hash);
            const {data: tx} = await axios.get(`https://core.spartanapi.dev/secret/chains/secret-4/transactions/${order.tx_hash}`)
            console.log('*TX*', tx)
            if (!tx) throw new Error('TX Not Found. SecretNodes may be behind. If this isnt fixed soon, contact Xiph.')
            if (tx.raw_transaction.tx_response.code) throw new Error('TX for given hash failed, this shouldnt happen...')

            const height = tx.height;

            

        //--- Verify Teddy Transfers ---//
            setLoading('Verifying Teddy Transfers...');

            //get owned teddies
            const tedInventory = await queryOwnedTokens(queryJs, walletAddress, signature);
            console.log('*TEDDY INVENTORY*',tedInventory)

            //verify connected wallet holds the teddies
            if (!tedInventory.includes(ids[0])) throw new Error(`Admin wallet doesn't hold teddy ID ${ids[0]}. This shouldn't happen...`);
            if (!tedInventory.includes(ids[1])) throw new Error(`Admin wallet doesn't hold teddy ID ${ids[1]}. This shouldn't happen...`);
            if (!tedInventory.includes(ids[2])) throw new Error(`Admin wallet doesn't hold teddy ID ${ids[2]}. This shouldn't happen...`);

            //get teddy xfer history
            const data = await queryTokenHistory(queryJs, walletAddress, signature)
            console.log('*HISTORY*',data)

            // get xfers at tx height
            const xfersAtHeight = data.filter(v=>v.block_height===height);
            console.log('*XFERS AT TX HEIGHT*', xfersAtHeight)

            //find transfers for teddy IDs in this order
            const teddy1xfer = xfersAtHeight.find(v=>v.token_id===ids[0])
            const teddy2xfer = xfersAtHeight.find(v=>v.token_id===ids[1])
            const teddy3xfer = xfersAtHeight.find(v=>v.token_id===ids[2])
            if (!teddy1xfer || !teddy2xfer || !teddy3xfer){
                throw new Error('Teddies didnt appear to be transfered on that TX, this shouldnt happen...')
            }
            console.log('*TEDDY XFERS*', teddy1xfer, teddy2xfer, teddy3xfer)

            //verify connected wallet was recipient
            console.log("*Current Addr*", walletAddress)
            if (teddy1xfer.action.transfer?.recipient!==walletAddress) throw new Error('You dont appear to be the recipient of the transfer. Are you connected with the admin wallet?')
            if (teddy2xfer.action.transfer?.recipient!==walletAddress) throw new Error('You dont appear to be the recipient of the transfer. Are you connected with the admin wallet?')
            if (teddy3xfer.action.transfer?.recipient!==walletAddress) throw new Error('You dont appear to be the recipient of the transfer. Are you connected with the admin wallet?')

            // verify previous owner is getting the new teddy
            setLoading('Verifying Previous Owner...');
            if (!teddy1xfer.action.transfer.from===order.owner) throw new Error(`Teddy doesnt appear to have been transfered from the owner address. This shouldn't happen...`)
            if (!teddy2xfer.action.transfer.from===order.owner) throw new Error(`Teddy doesnt appear to have been transfered from the owner address. This shouldn't happen...`)
            if (!teddy3xfer.action.transfer.from===order.owner) throw new Error(`Teddy doesnt appear to have been transfered from the owner address. This shouldn't happen...`)

        //--- Verify Payment ---//
            if (order.goldToken) {
                setLoading('Verifying Gold Token Transfer...');

                //get owned gold tokens
                const gtInventory = await queryOwnedTickets(queryJs, walletAddress, signature);
                console.log('*GT INVENTORY*',gtInventory)

                //verify connected wallet holds the token
                if (!gtInventory.includes(order.goldToken)) throw new Error(`Admin wallet doesn't hold the gold token used for payment. This shouldn't happen...`)

                //get token xfer history
                const gtData = await queryGoldTokenHistory(queryJs, walletAddress, signature)
                console.log('*GT HISTORY*',gtData)

                // get xfers at tx height
                const gtXfersAtHeight = gtData.filter(v=>v.block_height===height);
                console.log('*GT XFERS AT TX HEIGHT*', gtXfersAtHeight)

                //find transfers for Gold Token ID in this order
                const gtXfer = gtXfersAtHeight.find(v=>v.token_id===order.goldToken)

                if (!gtXfer){
                    throw new Error('Gold Token didnt appear to be transfered on that TX, this shouldnt happen...')
                }
                console.log('*GT XFER*', gtXfer)

                //verify connected wallet was recipient
                console.log("*Current Addr*", walletAddress)
                if (gtXfer.action.transfer?.recipient!==walletAddress) throw new Error('You dont appear to be the recipient of the gold token transfer. Are you connected with the admin wallet?')

                // verify previous owner is getting the new teddy
                setLoading('Verifying Previous Owner...');
                if (!gtXfer.action.transfer.from===order.owner) throw new Error(`Gold Token doesnt appear to have been transfered from the owner address. This shouldn't happen...`)
            } else {
                setLoading('Verifying sSCRT Payment...');
                let vkey;
                //get viewing key
                try {
                    vkey = await window.keplr.getSecret20ViewingKey(process.env.REACT_APP_CHAIN_ID, process.env.REACT_APP_TOKEN_ADDRESS)
                    console.log('*VIEW KEY*',vkey)
                } catch(error) {
                    if (error.toString().includes('There is no matched secret20'))
                        alert(`Error Verifying sSCRT Payment:\nsSCRT view key not found.\n\nPlease add token:\n${process.env.REACT_APP_TOKEN_ADDRESS}\n\nwith the view key provided by Xiphiar for chain:\n${process.env.REACT_APP_CHAIN_ID}`)
                    else
                        alert(`Unknown Error Getting View Key:\n${error}`)
                    
                    setLoading(false);
                    return;
                }

                try {
                    const balanceQuery = {
                        balance: {
                            address: walletAddress,
                            key: vkey
                        }
                    }
                    
                    const currentBalanceResult = await queryJs.query.compute.queryContract({
                        contractAddress: process.env.REACT_APP_TOKEN_ADDRESS,
                        codeHash: process.env.REACT_APP_TOKEN_HASH, // optional but way faster
                        query: balanceQuery,
                      }
                    );

                    console.log('Current Balance',parseInt(currentBalanceResult.balance.amount)/10e5);

                // Temporarily disabled, needs archive node
                /*
                    const { balance: heightBalance } = await queryJs.query.compute.queryContract({
                        contractAddress: process.env.REACT_APP_TOKEN_ADDRESS,
                        codeHash: process.env.REACT_APP_TOKEN_HASH, // optional but way faster
                        query: balanceQuery,
                      },
                      new grpc.Metadata({"x-cosmos-block-height": height.toString()})
                    );

                    const { balance: previousBalance } = await queryJs.query.compute.queryContract({
                        contractAddress: process.env.REACT_APP_TOKEN_ADDRESS,
                        codeHash: process.env.REACT_APP_TOKEN_HASH, // optional but way faster
                        query: balanceQuery,
                      },
                      new grpc.Metadata({"x-cosmos-block-height": (parseInt(height)-1).toString()})
                    );

                    const diff = parseInt(heightBalance.amount)-parseInt(previousBalance.amount);
                    console.log('Difference:', diff);

                    if (diff !== 5000000) throw new Error(`Invalid payment amount. Expected 5000000uSSCRT, received ${diff} uSSCRT`)
                */

                } catch(error) {
                    console.error(error);
                    alert(`Error Verifying sSCRT Payment:\n${error}`)
                    
                    setLoading(false);
                    return;
                }

            }

        //--- No Errors ---//
            setVerified(true);
            setLoading(false);
            console.log('OK');
            return true;
        } catch(error) {
            setLoading(false);
            console.error(error);
            toast.error(error.toString());
        }
    }

    const wrappedVerify = async() => {
        try {
            let isVerified = verified;
            if (!isVerified) isVerified = await handleVerify();
        } catch(e) {
            console.error(e)
            alert(`Failed to verify order! Are connected with the Admin wallet?\nError: ${e}`)
        }
        setLoading(false);
    }

    const handleMint = async() => {
        setLoadingMint(true);
        try {
            let isVerified = verified;
            if (!isVerified) isVerified = await handleVerify();

        //--- proceed to mint ---//
            if (isVerified) navigate('/mint',{state: {order: order}})
            
        } catch(e) {
            console.error(e)
            alert(`Failed to verify order! Are connected with the Admin wallet?\nError: ${e}`)
            setLoading(false);
            setLoadingMint(false);
        }
        setLoadingMint(false);
    }

        return (
            <Modal
                show={show}
                onHide={props.hide}
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                contentClassName="mintModal"
                centered
            >
            <Modal.Header>
                <div style={{width: "100%"}} className="text-center"><h3>Factory Order {order?.id}</h3></div>
            </Modal.Header>

            {false ?
            <>
                <Modal.Body>
                    <Container>
                        <Row className="justify-content-center">
                            <FactoryTeddyCard teddyId={order?.teddy1} nft_dossier={teddyData[0]?.nft_dossier} />
                            <FactoryTeddyCard teddyId={order?.teddy2} nft_dossier={teddyData[1]?.nft_dossier} />
                            <FactoryTeddyCard teddyId={order?.teddy3} nft_dossier={teddyData[2]?.nft_dossier} />
                        </Row>
                        <br />
                    </Container>
                </Modal.Body>
                <Modal.Footer className="justify-content-between">
                    <Button variant="secondary" onClick={props.hide}>
                        Close
                    </Button>
                    <Button variant="secondary" onClick={() => setView(false)}>
                        Back
                    </Button>
                </Modal.Footer>
            </>
            :
            <>
                <Modal.Body>
                    <Container>
                    {view ?
                    <>
                    <Row style={{paddingBottom: "20px"}}>
                        <FactoryTeddyCard teddyId={order?.teddy1} nft_dossier={teddyData[0]?.nft_dossier} />
                        <FactoryTeddyCard teddyId={order?.teddy2} nft_dossier={teddyData[1]?.nft_dossier} />
                        <FactoryTeddyCard teddyId={order?.teddy3} nft_dossier={teddyData[2]?.nft_dossier} />
                    </Row>
                    <hr/>
                    </>
                    : null }
                        <br/>
                        <Row className="justify-content-center">
                            <Col>
                                <span style={{fontWeight: "bold"}}>Date</span><br/>
                                <span style={{fontSize: "12px"}}>{new Date(order?.date).toString()}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Teddy IDs</span><br/>
                                <span style={{fontSize: "16px"}}>{order?.teddy1}&nbsp;&nbsp;&nbsp;{order?.teddy2}&nbsp;&nbsp;&nbsp;{order?.teddy3}</span><br/>
                                { !view ? <Button onClick={() => viewTeddies()}>View</Button> : null }
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Payment Method</span><br/>
                                <span style={{fontSize: "16px"}}>{order?.goldToken ? `Gold Token #${order?.goldToken}` : `sSCRT`}</span><br/>
                                { loading ?
                                    <>
                                    <Button disabled={true}><Spinner animation="border" variant="light" size="sm" /> Verify</Button><br/>
                                    <span>{loading}</span>
                                    </>
                                :
                                    <Button disabled={verified} onClick={() => wrappedVerify()}>{verified ? 'Verified ✔' : 'Verify'}</Button>
                                }
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>TX Hash</span><br/>
                                <span style={{fontSize: "12px"}}><a target='_blank' rel='noreferrer' href={`https://secretnodes.com/transactions/${order?.tx_hash}`}>{order?.tx_hash || "None. Wait, that shouldnt happen..."}</a></span><br/>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Name</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.name || 'None'}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Owner Address</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.owner}</span><br/>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Base Design</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_base || 'None'}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Color</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_color || 'None'}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Background</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_background || 'None'}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Face</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_face || 'None'}</span><br/>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Hand</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_hand || 'None'}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Head</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_head || 'None'}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Body</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_body || 'None'}</span><br/>
                            </Col>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Eyewear</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.final_eyewear || 'None'}</span><br/>
                            </Col>
                        </Row>
                        <br/>
                        <Row>
                            <Col>
                                <span style={{fontWeight: "bold"}}>Notes</span><br/>
                                <span style={{fontSize: "12px"}}>{order?.notes || "None"}</span><br/>
                            </Col>

                        </Row>
                        <br/>
                        <Row className="justify-content-center">
                            <Col xs={"auto"} className='text-center'>
                                { loading ?
                                    <>
                                    <Button disabled={true}> {loadingMint ? <Spinner animation="border" variant="light" size='sm' />:null} Mint</Button> &nbsp;&nbsp;&nbsp;
                                    <Button disabled={true}> {loadingCancel ? <Spinner animation="border" variant="light" size='sm' />:null} Cancel</Button>
                                    <br/>
                                    <span>{loading}</span>
                                    </>
                                :
                                    <><Button onClick={() => handleMint()}>Mint</Button> <Button onClick={() => handleCancel()}>Cancel</Button></>
                                }
                            </Col>
                        </Row>
                    </Container>
                </Modal.Body>
                <Modal.Footer className="justify-content-start">
                    <Button variant="secondary" onClick={props.hide}>
                        Close
                    </Button>
                </Modal.Footer>
            </>
            }

        </Modal>
        )
}
import React, {useState,useEffect} from 'react';
import { useNavigate } from "react-router-dom";

import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { getPermit } from "../utils/keplrHelper";
import { queryTokenHistory, queryTokenMetadata } from '../utils/dataHelper'
import { SecretNetworkClient } from 'secretjs';
import { Spinner } from 'react-bootstrap';
import FactoryTeddyCard from './FactoryTeddyCard'
import { toast } from 'react-toastify';

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
    //const [history, setHistory] = useState();
    let navigate = useNavigate();

    useEffect(()=>{
        setShow(props.show)
    },[props.show])

    useEffect(()=>{
        setOrder(props.order)
    },[props.order])

    let queryJs = undefined
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

    const handleMint = async() => {
        try {
            setLoading('Getting Permit...');
            await setupQueryJs();
            await setupPermit();

            const ids = [order.teddy1.toString(),order.teddy2.toString(),order.teddy3.toString()]

            setLoading('Verifying Transaction...');
            // verify tx hash
            const tx = await queryJs.query.getTx(order.tx_hash);
            console.log('*TX*', tx)
            if (tx.code) throw new Error('TX for given hash failed, this shouldnt happen...')

            const height = tx.height;

            setLoading('Verifying Token Transfers...');

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
                if (tx.code) throw new Error('Teddies didnt appear to be transfered on that TX, this shouldnt happen...')
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


            setLoading('OK!');
            console.log('OK')

            //proceed to mint
            navigate('/mint',{state: {order: order}})
        } catch(e) {
            console.error(e)
            alert(`Failed to verify order! Are connected with the Admin wallet?\nError: ${e}`)
            setLoading(false);
        }
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
                                <span style={{fontWeight: "bold"}}>TX Hash</span><br/>
                                <span style={{fontSize: "12px"}}><a target='_blank' rel='noreferrer' href={`https://secretnodes.com/secret/chains/${process.env.REACT_APP_CHAIN_ID}/transactions/${order?.tx_hash}`}>{order?.tx_hash || "None. Wait, that shouldnt happen..."}</a></span><br/>
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
                                    <Button disabled={true}><Spinner animation="border" variant="light" /></Button><br/>
                                    <span>{loading}</span>
                                    </>
                                :
                                    <Button onClick={() => handleMint()}>Mint</Button>
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
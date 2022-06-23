import { Col } from "react-bootstrap";
import {useState, useEffect} from 'react';
import Spinner from 'react-bootstrap/Spinner'
//import { getPermit, getSigningClient, getQueryClient, getChainId, getAddress } from "../utils/keplrHelper";
import { decryptFile, getRarityData, queryTokenMetadata, processRarity, getTotalTokens, getPublicTeddyData, cachePublicImage, cachePrivateImage, getPrivateImage, blobToBase64 } from '../../utils/dataHelper'
import { SecretNetworkClient } from "secretjs";
import {toast} from 'react-toastify';

import './FactoryTeddyCard.css'

export default function FactoryTeddyCard({teddyId, nft_dossier}){
    const [decryptedImage, setDecryptedImage] = useState();
    const [loading, setLoading] = useState(true);
    const [secretJs, setSecretJs] = useState()
    const [signerAddress, setSignerAddress] = useState();
    const [attributes, setAttributes] = useState();

    const init = async() => {
        /*
        if (!this.state.secretJs) {
            const queryJs = await SecretNetworkClient.create({
                grpcWebUrl: process.env.REACT_APP_GRPC_URL,
                chainId: process.env.REACT_APP_CHAIN_ID,
            });
            setSecretJs(queryJs);
        }
        */
        //get teddy info
        // window.keplr.enable(process.env.REACT_APP_CHAIN_ID);
        // const offlineSigner = window.getOfflineSigner(process.env.REACT_APP_CHAIN_ID);
        // const accounts = await offlineSigner.getAccounts();
        // const signature = await getPermit(accounts[0].address);

        if (nft_dossier) {
            let privImageUrl;
            let privImageKey;
            let attribs;
            // determine if data is swapped
            if (nft_dossier.private_metadata.extension.image){
                //is swapped
                privImageUrl = nft_dossier.public_metadata.extension.media[0].url;
                privImageKey = nft_dossier.public_metadata.extension.media[0].authentication.key;
                attribs = nft_dossier.public_metadata.extension.attributes;
            } else {
                privImageUrl = nft_dossier.private_metadata.extension.media[0].url;
                privImageKey = nft_dossier.private_metadata.extension.media[0].authentication.key;
                attribs = nft_dossier.private_metadata.extension.attributes;
            }
            setAttributes(attribs);
            setLoading(false);

            const cachedPrivateImage = await getPrivateImage(teddyId);
            if (cachedPrivateImage){
                console.log("using cached private image")
                setDecryptedImage(cachedPrivateImage)
            }
            else {
                const url = privImageUrl.replace('ipfs.io', process.env.REACT_APP_IPFS_MIRROR || 'infura-ipfs.io');
                const decrypted = await decryptFile(url, privImageKey);
                if (!!decrypted.length) {

                    const blob = new Blob([decrypted], {
                        type: `image/png`,
                    });

                    const base64 = await blobToBase64(blob);
                
                    setDecryptedImage(base64)
                    cachePrivateImage(teddyId, base64)
                }
            }
        }
    }

    useEffect(() => {
        init();
    }, [nft_dossier])


    return(
        <Col md="4" className="d-flex justify-content-center" style={{ flexDirection: "column" }}>
            <h5>Teddy {teddyId}</h5>
            { loading ?
                <div>
                    <Spinner animation="border" variant="primary" />
                    <h5>Loading...</h5>
                </div>
            :  
                <div className="d-flex justify-content-center align-items-center" style={{flexDirection: 'column'}}>
                    { decryptedImage ?
                        <div className="factory-img-container d-flex justify-content-center">
                            <img src={decryptedImage} alt={`Midnight Teddy ${teddyId}`} key={`teddy-${teddyId}`} />
                        </div>
                    :
                        <div>
                            <Spinner animation="border" variant="primary" />
                            <h5>Decrypting...</h5>
                        </div>
                    }
                    <br/>
                    <div style={{width: '75%', lineHeight: "120%"}}>
                    { attributes.map(item => <div style={{lineHeight: "110%", paddingBottom: "15px"}}>
                            <span style={{fontWeight: "bold"}}>{item.trait_type}</span><br/>
                            <span style={{fontSize: "12px"}}>{item.value}</span><br/>
                        </div>
                    )}
                    </div>
                </div>
            }
        </Col>
    )
}
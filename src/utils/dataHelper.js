import axios from "axios";
import { permitQuery, getChainId } from './keplrHelper'
import { get, set } from 'idb-keyval';
import retry from 'async-await-retry';
import { download, decrypt } from './decryptHelper'

const decryptFile = async (url, key) => {
    try {
        console.log('Downloading...');

        const data = await retry(
          async() => {
            const { data } = await download(url);
            return data;
          },
          null,
          {
            retriesMax: 5,
            interval: 1000
          },
        );
        
        console.log('Downloaded. Decrypting...')
        const decrypted = decrypt(data, key);
        return decrypted;
      /*
      return await retry(
        async() => {
          return await axios.post(
            `https://stashh.io/decrypt`,
            {
              url,
              key
            },
            {
              timeout: 10000,
              responseType: "blob"
            }
          );
        },
        null,
        {
          retriesMax: 5,
          interval: 1000
        },
      );
      */

    } catch (error) {
      throw error;
    }
  };

const getKnownImage = async(id, fetch = true) => {
  //try to get private image data from IDB
  const priv = await get(`MTC-Teddy-${id}-Private-Image`);
  if (priv) return priv;

  //try to get public URL from IDB
  const pub = await get(`MTC-Teddy-${id}-Public-Image`);
  if (pub) return pub;

  //get public URL from backend API
  if (fetch) {
    const data = await getPublicTeddyData(id);
    
    //cache in IDB
    cachePublicImage(id, data.pub_url)

    return data.pub_url;
  }
  
  //else
  return false;
}

const getPrivateImage = async(id) => {
  //try to get private image data from IDB
  const priv = get(`MTC-Teddy-${id}-Private-Image`);
  if (priv) return priv;
  
  //else
  return false;
}

const cachePublicImage = (id, url) => {
  set(`MTC-Teddy-${id}-Public-Image`, url);
}

const cachePrivateImage = async(id, data) => {
  set(`MTC-Teddy-${id}-Private-Image`, data).then(() => console.log("successfully cached."))
  
}

const correctTrait = (trait) => {
  switch (trait.toLowerCase()) {
    case "i <3 mum tatoo":
      return "I <3 MUM Tattoo"
    case "terra hoodie":
      return "LUNA Hoodie"
    case "crocodile dundee hat":
      return "Crocodile Dundee hat"
    default:
      return trait
  }
}

const getRarityData = async(traitValue) => {
    const data = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/rarity/score/${traitValue}`);
    return data.data;
}

const getPublicTeddyData = async(id) => {
    const data = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/teddy/${id}`);
    return data.data;
}

const getTotalTokens = async(traitValue) => {
    const data = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/rarity/total`);
    return data.data;
}

const verifydiscord = async (signedMessage, tokenId) => {
  var params = new URLSearchParams();
    params.append('signedMessage', signedMessage);
    params.append('tokenId', tokenId);

  const data = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/verifydiscord`, params);
  return data.data
};

const queryOwnedTokens = async(client, address, permit) => {
    const query = {
        tokens: {
          owner: address,
          limit: 300
        }
    }
    // const chainId = getChainId();
    // const query2 = new permitQuery(query, permit, chainId);
    // let data = await client.queryContractSmart(process.env.REACT_APP_CONTRACT_ADDRESS, query2, {}, process.env.REACT_APP_CONTRACT_CODE_HASH);
    // return data.token_list.tokens;
    try {
      const chainId = getChainId();
      if (!permit.signature) throw new Error('Permit not provided for tokens query.')
  
      const query2 = new permitQuery(query, permit, chainId);
      console.log('Query',query);
      
      const data = await client.query.compute.queryContract({
        contractAddress: process.env.REACT_APP_NFT_ADDRESS,
        codeHash: process.env.REACT_APP_NFT_HASH,
        query: query2,
      })
      console.log('Query Data', data);
      return data.token_list.tokens;
        
    } catch(error) {
      console.error(error)
      throw error;
    }
}

const queryOwnedTickets = async(client, address, permit) => {
  const query = {
      tokens: {
        owner: address,
        limit: 300
      }
  }
  // const chainId = getChainId();
  // const query2 = new permitQuery(query, permit, chainId);
  // let data = await client.queryContractSmart(process.env.REACT_APP_TICKET_ADDRESS, query2, {}, process.env.REACT_APP_TICKET_CODE_HASH);
  // return data.token_list.tokens;
  try {
    const chainId = getChainId();
    if (!permit.signature) throw new Error('Permit not provided for history query.')

    const query2 = new permitQuery(query, permit, chainId);
    console.log('Query',query);
    const data = await client.query.compute.queryContract({
      contractAddress: process.env.REACT_APP_TICKET_ADDRESS,
      codeHash: process.env.REACT_APP_TICKET_CODE_HASH,
      query: query2,
    })
    console.log('Query Data', data);
    return data.token_list.tokens;
      
  } catch(error) {
    console.error(error)
    throw error;
  }
}

const queryTokenMetadata = async(client, id, permit) => {
    const query = {
        nft_dossier: {
          token_id: id
        }
    }
  try {
    const chainId = getChainId();
    if (permit.signature){
        const query2 = new permitQuery(query, permit, chainId);
        //const data = await client.queryContractSmart(process.env.REACT_APP_CONTRACT_ADDRESS, query2, {}, process.env.REACT_APP_CONTRACT_CODE_HASH);
        const data = await client.query.compute.queryContract({
          contractAddress: process.env.REACT_APP_NFT_ADDRESS,
          codeHash: process.env.REACT_APP_NFT_HASH,
          query: query2,

        })
        console.log(data)
        /*
        let priv_attributes = {};
        for (let i = 0; i < (nft_dossier.private_metadata?.extension?.attributes || []).length; i++) {
          priv_attributes[nft_dossier.private_metadata.extension.attributes[i].trait_type] = correctTrait(nft_dossier.private_metadata.extension.attributes[i].value);
        }

        let pub_attributes = {};
        for (let i = 0; i < nft_dossier.public_metadata.extension.attributes.length; i++) {
          pub_attributes[nft_dossier.public_metadata.extension.attributes[i].trait_type] = correctTrait(nft_dossier.public_metadata.extension.attributes[i].value);
        }
        */
        return({
            nft_dossier: data.nft_dossier,
            //priv_attributes: priv_attributes,
            //pub_attributes: pub_attributes
        });
        
    } else {
      console.log("no permit query")
      //let data = await client.queryContractSmart(process.env.REACT_APP_CONTRACT_ADDRESS, query, {}, process.env.REACT_APP_CONTRACT_CODE_HASH);
      let data = await client.query.compute.queryContract({
        contractAddress: process.env.REACT_APP_NFT_ADDRESS,
        codeHash: process.env.REACT_APP_NFT_HASH,
        query: query
      })
        let attributes = {};
        let unknown = "";
        if (data.nft_dossier.public_metadata.extension.attributes.length===1) unknown = "?"
        for (let i = 0; i < data.nft_dossier.public_metadata.extension.attributes.length; i++) {
            attributes[data.nft_dossier.public_metadata.extension.attributes[i].trait_type] = data.nft_dossier.public_metadata.extension.attributes[i].value + unknown;
          }
        return({
            nft_dossier: data.nft_dossier,
            pub_attributes: attributes
        });
    }
  } catch(error) {
    console.error(error)
  }
}

const queryTokenHistory = async(client, address, permit) => {
  const query = {
      transaction_history: {
        address: address,
        page_size: 300
      }
  }
  try {
    const chainId = getChainId();
    if (!permit.signature) throw new Error('Permit not provided for history query.')

    const query2 = new permitQuery(query, permit, chainId);
    console.log('Query',query);
    const data = await client.query.compute.queryContract({
      contractAddress: process.env.REACT_APP_NFT_ADDRESS,
      codeHash: process.env.REACT_APP_NFT_HASH,
      query: query2,
    })
    console.log('Query Data', data);
    return data.transaction_history.txs;
      
  } catch(error) {
    console.error(error)
    throw error;
  }
}

const queryGoldTokenHistory = async(client, address, permit) => {
  const query = {
      transaction_history: {
        address: address,
        page_size: 300
      }
  }
  try {
    const chainId = getChainId();
    if (!permit.signature) throw new Error('Permit not provided for history query.')

    const query2 = new permitQuery(query, permit, chainId);

    const data = await client.query.compute.queryContract({
      contractAddress: process.env.REACT_APP_TICKET_ADDRESS,
      codeHash: process.env.REACT_APP_TICKET_HASH,
      query: query2,
    })

    return data.transaction_history.txs;

  } catch(error) {
    console.error(error)
    throw error;
  }
}

const batchQueryTokenMetadata = async(client, ids, permit) => {
  const query = {
      batch_nft_dossier: {
        token_ids: ids
      }
  }
  console.log(query)
  const chainId = getChainId();

  if (permit.signature){

      const query2 = new permitQuery(query, permit, chainId);
      const data = await client.queryContractSmart(process.env.REACT_APP_CONTRACT_ADDRESS, query2, {}, process.env.REACT_APP_CONTRACT_CODE_HASH);
      
      let priv_attributes = {};
      for (let i = 0; i < data.nft_dossier.private_metadata.extension.attributes.length; i++) {
        priv_attributes[data.nft_dossier.private_metadata.extension.attributes[i].trait_type] = correctTrait(data.nft_dossier.private_metadata.extension.attributes[i].value);
      }

      let pub_attributes = {};
      for (let i = 0; i < data.nft_dossier.public_metadata.extension.attributes.length; i++) {
        pub_attributes[data.nft_dossier.public_metadata.extension.attributes[i].trait_type] = correctTrait(data.nft_dossier.public_metadata.extension.attributes[i].value);
      }
      return({
          nft_dossier: data.nft_dossier,
          priv_attributes: priv_attributes,
          pub_attributes: pub_attributes
      });
      
  } else {
    console.log("no permit query")
      let data = await client.queryContractSmart(process.env.REACT_APP_CONTRACT_ADDRESS, query, {}, process.env.REACT_APP_CONTRACT_CODE_HASH);
      let attributes = {};
      let unknown = "";
      if (data.nft_dossier.public_metadata.extension.attributes.length===1) unknown = "?"
      for (let i = 0; i < data.nft_dossier.public_metadata.extension.attributes.length; i++) {
          attributes[data.nft_dossier.public_metadata.extension.attributes[i].trait_type] = data.nft_dossier.public_metadata.extension.attributes[i].value + unknown;
        }
      return({
          nft_dossier: data.nft_dossier,
          pub_attributes: attributes
      });
  }
}

const processRarity = async(attributes) => {
        let rarity = {}
        let total = 0;
        for (const key in attributes) {
            const data = await getRarityData(attributes[key]);
            rarity[attributes[key]] = data;
            total += data.score
        }
        rarity.total = total;
        return rarity;
}

const truncate = function (fullStr, strLen, separator = '...') {
  if (fullStr.length <= strLen) return fullStr;

  var sepLen = separator.length,
      charsToShow = strLen - sepLen,
      frontChars = Math.ceil(charsToShow/2),
      backChars = Math.floor(charsToShow/2);

  return fullStr.substr(0, frontChars) + 
         separator + 
         fullStr.substr(fullStr.length - backChars);
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export { decryptFile, getRarityData, queryOwnedTokens,queryTokenHistory, queryGoldTokenHistory, queryOwnedTickets, queryTokenMetadata, batchQueryTokenMetadata, processRarity, getTotalTokens, verifydiscord, getPublicTeddyData, truncate, cachePrivateImage, cachePublicImage, getPrivateImage, getKnownImage, blobToBase64 };

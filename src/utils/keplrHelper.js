import { Bech32 } from "@iov/encoding";

const permitName = "midnightteddy.club";
const allowedTokens = [process.env.REACT_APP_NFT_ADDRESS];
const permissions = ["owner" /* , "history", "allowance" */];

let myStorage = window.sessionStorage;

const customFees = {
    exec: {
        amount: [{ amount: "50000", denom: "uscrt" }],
        gas: process.env.REACT_APP_MINT_GAS || "300000",
    }
}

const getApiURL = () => {
  let apiUrl = process.env.REACT_APP_MAINNET_REST;
  if (process.env.REACT_APP_USE_TESTNET === "true"){
      apiUrl = process.env.REACT_APP_TESTNET_REST
  }
  return apiUrl;
}

const getChainId = () => {
  return process.env.REACT_APP_CHAIN_ID;
}

const permitQuery = class {
  constructor(query, permit, chainId){
    this.with_permit = {
      query: query,
      permit: {
        params: {
          permit_name: permitName,
          allowed_tokens: allowedTokens,
          chain_id: chainId,
          permissions: permissions,
        },
        signature: permit,
      }
    }
  }
}

async function suggestTestnet() {
    await window.keplr.experimentalSuggestChain({
        chainId: process.env.REACT_APP_TESTNET_CHAIN_ID,
        chainName: 'Secret Testnet',
        rpc: process.env.REACT_APP_TESTNET_RPC,
        rest: process.env.REACT_APP_TESTNET_REST,
        bip44: {
            coinType: 529,
        },
        coinType: 529,
        stakeCurrency: {
            coinDenom: 'SCRT',
            coinMinimalDenom: 'uscrt',
            coinDecimals: 6,
        },
        bech32Config: {
            bech32PrefixAccAddr: 'secret',
            bech32PrefixAccPub: 'secretpub',
            bech32PrefixValAddr: 'secretvaloper',
            bech32PrefixValPub: 'secretvaloperpub',
            bech32PrefixConsAddr: 'secretvalcons',
            bech32PrefixConsPub: 'secretvalconspub',
        },
        currencies: [
            {
                coinDenom: 'SCRT',
                coinMinimalDenom: 'uscrt',
                coinDecimals: 6,
            },
        ],
        feeCurrencies: [
            {
                coinDenom: 'SCRT',
                coinMinimalDenom: 'uscrt',
                coinDecimals: 6,
            },
        ],
        gasPriceStep: {
            low: 0.1,
            average: 0.25,
            high: 0.4,
        },
        features: ['secretwasm', "ibc-go", "ibc-transfer"],
    });
}

async function getPermit(address){
  let data = myStorage.getItem(`teddy-permit-2-${process.env.REACT_APP_CONTRACT_ADDRESS}-${address}`);
  if (data) { return JSON.parse(data); }


  let chainId = process.env.REACT_APP_CHAIN_ID;
  window.keplr.enable(chainId);

  console.log(chainId, address)
  const { signature } = await window.keplr.signAmino(
    chainId,
    address,
    {
      chain_id: chainId,
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
            allowed_tokens: allowedTokens,
            permissions: permissions,
          },
        },
      ],
      memo: "", // Must be empty
    },
    {
      preferNoSetFee: true, // Fee must be 0, so hide it from the user
      preferNoSetMemo: true, // Memo must be empty, so hide it from the user
    }
  );
  myStorage.setItem(`teddy-permit-2-${process.env.REACT_APP_CONTRACT_ADDRESS}-${address}`, JSON.stringify(signature));
  return signature;
}

const getAddress = async() => {
  const chainID = getChainId();
  const offlineSigner = window.getOfflineSigner(chainID);
  const accounts = await offlineSigner.getAccounts();
  return accounts[0].address;
}

// async function getSigningClient() {
//     let chainId = process.env.REACT_APP_MAINNET_CHAIN_ID;
//     let apiUrl = process.env.REACT_APP_MAINNET_REST;
//     if (process.env.REACT_APP_USE_TESTNET === "true"){
//         await suggestTestnet();
//         chainId = process.env.REACT_APP_TESTNET_CHAIN_ID
//         apiUrl = process.env.REACT_APP_TESTNET_REST
//     }
//     console.log(apiUrl, chainId)
//     window.keplr.enable(chainId);
//     const offlineSigner = window.getOfflineSigner(chainId);
//     const enigmaUtils = window.getEnigmaUtils(chainId);
//     const accounts = await offlineSigner.getAccounts();
//     return {
//       client: new ExtendedSender(
//           apiUrl,
//           accounts[0].address,
//           offlineSigner,
//           enigmaUtils,
//           customFees,
//           BroadcastMode.Sync
//         ),
//       address: accounts[0].address
//     }
// }

// async function getQueryClient() {
//   let apiUrl = process.env.REACT_APP_MAINNET_REST;
//   if (process.env.REACT_APP_USE_TESTNET === "true"){
//       await suggestTestnet();
//       apiUrl = process.env.REACT_APP_TESTNET_REST
//   }
//   const client = new CosmWasmClient(apiUrl);
//   return client;
// }

function isValidAddress(address) {
    try {
      const { prefix, data } = Bech32.decode(address);
      if (prefix !== "secret") {
        return false;
      }
      return data.length === 20;
    } catch {
      return false;
    }
  }

function countDecimals(value) {
    if(Math.floor(value) === value) return 0;
    return value.toString().split(".")[1]?.length || 0; 
}

export { getPermit, isValidAddress, countDecimals, getAddress, permitName, allowedTokens, permissions, permitQuery, getChainId, getApiURL }
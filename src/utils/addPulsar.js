const addPulsar = async(coinType = 529) => {
    if (!window.getOfflineSigner || !window.keplr) {
        alert("Please install keplr extension");
    }
    window.keplr.experimentalSuggestChain({
        chainId: 'pulsar-2',
        chainName: 'Secret Pulsar2',
        //rpc: 'https://rpc.pulsar.griptapejs.com/',
        //rest: 'https://api.pulsar.griptapejs.com',
        rpc: 'https://pulsar-2.api.trivium.network:26657',
        rest: 'https://pulsar-2.api.trivium.network:1317',
        bip44: {
            coinType: coinType,
        },
        coinType: coinType,
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
        features: ['secretwasm','ibc-transfer','ibc-go'],
    });
}

export default addPulsar;
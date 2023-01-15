import retry from 'async-await-retry';
import axios from 'axios'

async function encryptFile(file, id){
    //get original image file
    //const img = fs.readFileSync(path);
    //const img = Buffer.from(file)
    //console.log(img);

    const fileName = `MTC-${id}`;

    //prepare POST data
    console.log('File to Encrypt:', file);
    console.log('New Filename:', fileName);

    const formData = new FormData();
    formData.append("data", file, fileName);
    formData.append("config", JSON.stringify({ encrypt: true }));

    const res = await retry(
        () => {
            console.log(`trying to upload`)
            return axios.post(
                `https://stashh.io/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
                    }, timeout: 30000
                });
        },
        null,
        {
            retriesMax: 3,
            interval: 10000,
        },
    );
    console.log(res);
    return {hash: res.data[0].hash, key: res.data[0].key}
}

export default encryptFile;
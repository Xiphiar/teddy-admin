//const buffer = require('buffer');
var Buffer = require('buffer/').Buffer
const crypto = require('crypto');
const axios = require('axios');
//var fs = require('fs');

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

const download = async (url) => {
   return axios.get(url, {
     responseType: 'arraybuffer'
   })
}

const decrypt = (input, key) => {
  //console.log("key is ", key);
  const dataBuffer = Buffer.from(input)
  const data32 = dataBuffer.toString('utf-8').substring(0, 32);
  const cipherKey = Buffer.from(key);
  const ivSize = dataBuffer.readUInt8(0);
  const iv = dataBuffer.slice(1, ivSize + 1);
  const authTag = dataBuffer.slice(ivSize + 1, ivSize + 17);
  const decipher = crypto.createDecipheriv(ALGORITHM, cipherKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([
    decipher.update(dataBuffer.slice(ivSize + 17)),
    decipher.final(),
  ]);
};


export { download, decrypt };
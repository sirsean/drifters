import { makePagesFunction } from 'vite-plugin-cloudflare-functions/worker';
import { ethers } from 'ethers';
import DrifterABI from '../../../src/assets/abi/DrifterABI';

const DRIFTER_ADDRESS = '0xe3B399AAb015D2C0D787ECAd40410D88f4f4cA50';

function drifterKey(drifterId) {
    return `${drifterId}.json`;
}

export const onRequestGet = makePagesFunction(async ({ params, env }) => {
    const { drifterId } = params;
    const obj = await env.DRIFTER_NARRATIVES.get(drifterKey(drifterId));
    if (obj) {
        const reader = obj.body.getReader();
        let body = '';
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            body += new TextDecoder('utf-8').decode(value);
        }
        return JSON.parse(body);
    } else {
        return {
            drifterId,
        };
    }
});

async function getSHA256Hash(str) {
  const textBuffer = new TextEncoder().encode(str); // Convert string to ArrayBuffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer); // Get hash
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert to byte array
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // Convert to hex
}

export const onRequestPost = makePagesFunction(async ({ params, request, env }) => {
    const { drifterId } = params;
    const { narrative, signedMessage, signature } = await request.text().then(body => JSON.parse(body));
    // look up ownerOf(drifterId)
    const provider = new ethers.JsonRpcProvider('https://ethereum.sirsean.me/v1/mainnet');
    const contract = new ethers.Contract(DRIFTER_ADDRESS, DrifterABI, provider);
    const owner = await contract.ownerOf(drifterId);
    // find out who signed body.signature; it must be the owner
    const signer = ethers.verifyMessage(signedMessage, signature);
    if (signer.toLowerCase() != owner.toLowerCase()) {
        throw('The owner of this drifter did not sign the message.');
    }
    // hash the narrative
    const hash = await getSHA256Hash(narrative);
    // reconstruct the message template; it must match the original
    const reconstructed = `I own Drifter ${drifterId} and I am posting ${hash}`;
    if (signedMessage != reconstructed) {
        throw('Incorrect signed message.');
    }
    // if all that worked, save the new narrative to R2
    const obj = {
        drifterId,
        narrative,
        signedMessage,
        signature,
    };
    await env.DRIFTER_NARRATIVES.put(drifterKey(drifterId), JSON.stringify(obj));
    // and then return the original request, signifying success
    return obj;
});
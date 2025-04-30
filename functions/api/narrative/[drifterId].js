import { ethers } from 'ethers';
import DrifterABI from '../abi.js';

const DRIFTER_ADDRESS = '0xe3B399AAb015D2C0D787ECAd40410D88f4f4cA50';

function drifterKey(drifterId) {
    return `${drifterId}.json`;
}

export async function onRequestGet({ params, env }) {
    try {
        const { drifterId } = params;
        const obj = await env.DRIFTER_NARRATIVES.get(drifterKey(drifterId));
        
        if (obj) {
            const text = await obj.text();
            return new Response(text, {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({
                drifterId,
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        console.error(`Error getting narrative for drifter ${params.drifterId}:`, error);
        return new Response(JSON.stringify({
            error: error.message || 'An error occurred'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function getSHA256Hash(str) {
    const textBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ params, request, env }) {
    try {
        const { drifterId } = params;
        const { narrative, signedMessage, signature } = await request.json();
        
        console.log(`Creating narrative for drifter ${drifterId}...`);
        console.log(`Connecting to RPC provider...`);
        
        // Check if ETHEREUM_RPC_URL is set
        if (!env.ETHEREUM_RPC_URL) {
            throw new Error('ETHEREUM_RPC_URL environment variable is not set. Please configure an Ethereum RPC provider URL.');
        }
        
        console.log(`Using RPC URL from environment variables`);
        
        // Connect to Ethereum
        let provider;
        try {
            provider = new ethers.JsonRpcProvider(env.ETHEREUM_RPC_URL);
            await provider.getNetwork();
            console.log(`Provider connected successfully`);
        } catch (e) {
            console.error(`Ethereum provider error: ${e.message}`);
            throw new Error(`Failed to connect to Ethereum provider. Please check your ETHEREUM_RPC_URL configuration. Error: ${e.message}`);
        }
        
        console.log(`Creating contract instance...`);
        const contract = new ethers.Contract(DRIFTER_ADDRESS, DrifterABI, provider);
        console.log(`Calling ownerOf(${drifterId})...`);
        const owner = await contract.ownerOf(drifterId);
        console.log(`Owner of drifter ${drifterId}: ${owner}`);
        
        // Verify signature
        console.log(`Verifying signature...`);
        const signer = ethers.verifyMessage(signedMessage, signature);
        console.log(`Signature signer: ${signer}`);
        
        if (signer.toLowerCase() != owner.toLowerCase()) {
            console.log(`Signature verification failed: ${signer} != ${owner}`);
            return new Response(JSON.stringify({
                error: 'The owner of this drifter did not sign the message.'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Hash the narrative and verify message
        const hash = await getSHA256Hash(narrative);
        console.log(`Narrative hash: ${hash}`);
        
        const reconstructed = `I own Drifter ${drifterId} and I am posting ${hash}`;
        console.log(`Reconstructed message: ${reconstructed}`);
        console.log(`Original signed message: ${signedMessage}`);
        
        if (signedMessage != reconstructed) {
            console.log(`Message verification failed`);
            return new Response(JSON.stringify({
                error: 'Incorrect signed message.'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Save the narrative to R2
        const obj = {
            drifterId,
            narrative,
            signedMessage,
            signature,
            author: owner,
        };
        
        console.log(`Saving narrative to R2...`);
        await env.DRIFTER_NARRATIVES.put(drifterKey(drifterId), JSON.stringify(obj));
        console.log(`Narrative saved successfully`);
        
        return new Response(JSON.stringify(obj), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Narrative creation error:", error);
        return new Response(JSON.stringify({
            error: error.message || 'An error occurred',
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
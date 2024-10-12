import sha256 from "crypto-js/sha256.js";
import { MerkleTree } from "merkletreejs"
import express from 'express';
import bls from "@chainsafe/bls";
import { Signature } from "@chainsafe/bls/blst-native";

const app = express();
app.use(express.json());

export let tree = new MerkleTree([], sha256);

export const pendingTransactions = [];

const constructBlock = async () => {
    // No block if no transactions
    if (pendingTransactions.length === 0) {
        console.log('No transactions to construct block');
        return;
    }

    // Copy pending transactions
    const transactions = [...pendingTransactions];

    // Copy tree
    const leaves = tree.getLeaves();
    const newLeaves = [...leaves, ...transactions.map(t => t.hash)];
    const newTree = new MerkleTree(newLeaves, sha256);

    const signatures = [];

    // send the root to the senders to sign
    const root = newTree.getRoot().toString('hex');

    let requests = [];

    for (const transaction of transactions) {
        const sender = transaction.sender;

        const body = JSON.stringify({ 
            root,
            proof: newTree.getProof(transaction.hash).map(p => p.data.toString('hex')),
        });

        console.log('Sending sign request to', sender.url);
        console.log('Root:', root);
        console.log('Proof:', body);

        const request = await fetch(sender.url + '/sign', {
            method: 'POST',
            body,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await request.json();
        signatures.push(data.signature);
        console.log('Received signature:', data.signature);
    }

    
    // Aggregate signatures
    const aggregatedSignature = bls.aggregateSignatures(signatures);

    // Aggregate sender addresses
    const aggregatedPublicKey = bls.aggregatePublicKeys(senders);

    // Verify signature
    const verified = bls.verify(aggregatedPublicKey, root, aggregatedSignature);

    if (!verified) {
        throw new Error('Invalid signature');
    }

    // Construct block
    const block = {
        number: Object.keys(blockchainState.blocks).length,
        root,
        senders: senders.map(s => s.address),
        signature: aggregatedSignature,
    };

    fetch('http://localhost:3000/addBlock', {
        method: 'POST',
        body: JSON.stringify(block),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        console.log('Block constructed');
    })
    .catch(err => {
        console.error(err);
    });

    // Clear pending transactions
    pendingTransactions.length = 0;
    tree = newTree;
}

app.post('/addTransaction', (req, res) => {
    const transaction = req.body;
    pendingTransactions.push(transaction);

    res.send(JSON.stringify({ status: 'OK' }));
});

app.listen(3001, () => {
    console.log('Listening on port 3001');
});

// Construct block every 5 seconds
setInterval(async () => {
    await constructBlock();
}, 5000);
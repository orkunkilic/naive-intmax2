import express from 'express';
import bls from "@chainsafe/bls";

const app = express();
app.use(express.json());

const secretKey = bls.SecretKey.fromKeygen();
const publicKey = secretKey.toPublicKey();

const pendingTransactions = [];

app.post('/sendTransaction', (req, res) => {
    const transaction = {
        hash: '0x' + Math.random().toString(36).substring(7),
        sender: {
            address: publicKey,
            url: 'http://localhost:3002',
        }
    }
    fetch('http://localhost:3001/addTransaction', {
        method: 'POST',
        body: JSON.stringify(transaction),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(res => res.json())
    .then(data => {
        console.log(data);
        pendingTransactions.push(transaction);
        res.send(JSON.stringify({ status: 'OK' }));
    })
});

app.post('/sign', (req, res) => {
    console.log('Received sign request');

    const { root, proof } = req.body;

    // Root hex to buffer
    const rootBuffer = Buffer.from(root, 'hex');
    
    // TODO: Verify proof

    // sign root
    const signature = secretKey.sign(rootBuffer);

    console.log('Sending signature:', signature);

    res.send({
        signature,
    });
});

app.listen(3002, () => {
    console.log('User running on port 3002');
});
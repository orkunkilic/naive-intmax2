import bls from "@chainsafe/bls";
import express from 'express';

const app = express();

export const blockchainState = {
    blocks: {
        0: {
            root: '0x',
            senders: ['0x'],
            signature: '0x',
        }
    },
};

export const addBlock = (block) => {
    // Aggregate sender addresses
    const aggregatedPublicKey = bls.aggregatePublicKeys(block.senders);

    // Verify signature
    const signature = block.signature;
    const message = block.root;
    const verified = bls.verify(aggregatedPublicKey, message, signature);
    if (!verified) {
        throw new Error('Invalid signature');
    }

    blockchainState.blocks[block.number] = block;
}

app.use(express.json());

app.post('/addBlock', (req, res) => {
    const block = req.body;
    addBlock(block);
    res.send(JSON.stringify({ status: 'OK' }));
});

app.listen(3000, () => {
    console.log('Blockchain running on port 3000');
});
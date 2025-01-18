import { app, r2, upload } from '../../index.ts';

export default app.post('/api/upload/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        res.status(400).send('Missing file');
        return;
    }
    if (req.file.size > 20_000_000) { // 20 mb limit
        res.status(400).send('File too large');
        return;
    }

    try {
        const file = r2.file(req.file.originalname);
        if (await file.exists()) {
            res.status(400).send('File already exists');
            return;
        }
        await file.write(req.file.buffer);
        res.status(200).send('File uploaded');
        return;
    } catch (error) {
        console.log(error.stack ?? error);
        res.status(500).send(error);
        return;
    }
});
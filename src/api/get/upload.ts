import { app, r2 } from '../../index.ts';
import { randomUUID } from 'node:crypto';

export default app.get('/api/upload/', async (_req, res) => {
    try {
        let uuid = randomUUID();
        const check = r2.file(uuid);
        while (await check.exists())
            uuid = randomUUID();

        const uploadUrl = r2.presign(randomUUID(), {
            method: 'PUT',
            expiresIn: 3600,
            acl: 'public-read'
        });
        res.status(200).send(uploadUrl);
        return;
    } catch (error) {
        console.log(error.stack ?? error);
        res.status(500).send(error);
        return;
    }
});
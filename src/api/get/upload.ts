import { app, r2 } from '../../index.ts';
import { Submission } from '../../db.ts';
import { randomUUID } from 'node:crypto';

export default app.get('/api/upload', async (req, res) => {
    if (!req.oidc.isAuthenticated() || !req.oidc.user) {
        res.status(401).send('Unauthorized');
        return;
    }
    if (!req.query.marker) {
        res.status(400).send('Missing marker ID');
        return;
    }
    try {
        let uuid = randomUUID();
        const check = r2.file(uuid);
        while (await check.exists())
            uuid = randomUUID();

        const uploadUrl = r2.presign(uuid, {
            method: 'PUT',
            expiresIn: 3600,
            acl: 'public-read'
        });
        res.status(200).send(uploadUrl);

        Submission.create({ photoID: uuid, markerID: req.query.marker, userID: req.oidc.user.sub, username: req.oidc.user.name ?? req.oidc.user.given_name ?? req.oidc.user.nickname ?? req.oidc.user.email.split('@')[0] });
        return;
    } catch (error) {
        console.log(error.stack ?? error);
        res.status(500).send(error);
        return;
    }
});
import { app } from '../../index.ts';
import { requiresAuth } from 'express-openid-connect';
import { Submission } from '../../db.ts';

export default app.post('/api/likeSub', requiresAuth(), async (req, res) => {
    if (!req.oidc.isAuthenticated() || !req.oidc.user) {
        res.status(401).send('Unauthorized');
        return;
    }
    if (!req.query.ID) {
        res.status(400).send('Missing submission ID');
        return;
    }
    try {
        const submission = await Submission.findById(req.query.ID);
        if (!submission) {
            res.status(404).send('Submission not found');
            return;
        }
        if (submission.userID === req.oidc.user.sub) {
            res.status(403).send('Cannot like own submission');
            return;
        }
        if (submission.likes.includes(req.oidc.user.sub)) {
            submission.likes.splice(submission.likes.indexOf(req.oidc.user.sub), 1);
        } else {
            submission.likes.push(req.oidc.user.sub);
        }
        await submission.save();
        res.status(200).send(submission.likes.length.toString());
        return;
    } catch (error) {
        console.log(error.stack ?? error);
        res.status(500).send(error);
        return;
    }
});
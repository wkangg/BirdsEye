import { app } from '../../index.ts';
import { requiresAuth } from 'express-openid-connect';

export default app.get('/api/profile', requiresAuth(), async (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
});
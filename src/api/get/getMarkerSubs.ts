import { app } from '../../index.ts';
import { Submission } from '../../db.ts';

export default app.get('/api/getMarkerSubmissions', async (req, res) => {
    if (!req.query.marker) {
        res.status(400).send('Missing marker ID');
        return;
    }

    Submission.find({ markerID: req.query.marker }).then(subs => {
        res.status(200).send({ me: req.oidc.user?.sub, subs });
    }).catch(error => {
        console.log(error.stack ?? error);
        res.status(500).send(error);
    });
});
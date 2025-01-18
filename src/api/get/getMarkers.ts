import { app } from '../../index.ts';
import { Marker } from '../../db.ts';

export default app.get('/api/getMarkers', async (req, res) => {
    const { coords } = req.query;
    if (!coords || typeof coords !== 'string') {
        const markers = await Marker.find({});
        res.send(JSON.stringify(markers));
        return;
    }
    const coordinates = coords.split(',');
    if (coordinates.length !== 2) {
        const markers = await Marker.find({});
        res.send(JSON.stringify(markers));
        return;
    }
    const lat = Number(coordinates[0]);
    const lng = Number(coordinates[1]);
    if (isNaN(lat) || isNaN(lng)) {
        const markers = await Marker.find({});
        res.send(JSON.stringify(markers));
        return;
    }

    const markers = await Marker.find({
        lat: { $gte: lat - 0.1, $lte: lat + 0.1 },
        lng: { $gte: lng - 0.1, $lte: lng + 0.1 }
    });
    res.send(JSON.stringify(markers));
});
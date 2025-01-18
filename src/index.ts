import { S3Client } from 'bun';
import express from 'express';
import { auth } from 'express-openid-connect';
import multer from 'multer';
import bodyParser from 'body-parser';
import { setupDB } from './db.ts';
import { initRoutes } from './routes.ts';

if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !process.env.S3_ENDPOINT || !process.env.S3_BUCKET || !process.env.AUTH0_DOMAIN || !process.env.AUTH0_SECRET || !process.env.AUTH0_CLIENT_ID)
    throw new Error('Missing environment variables');

export const app: express.Express = express();
export const upload: multer.Multer = multer({ storage: multer.memoryStorage() });
export const r2 = new S3Client({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket: process.env.S3_BUCKET,
    endpoint: process.env.S3_ENDPOINT
});

if (app.get('env') === 'production') app.set('trust proxy', 1);

app.use(auth({
    authRequired: false,
    auth0Logout: true,
    baseURL: 'http://localhost:3000',
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    secret: process.env.AUTH0_SECRET
}));
app.use(bodyParser.json());
app.use(express.static('src/public'));

setupDB();
initRoutes();

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`\nlistening on port ${port}\nvisit http://localhost:${port}\n----------------------------`));

process.on('unhandledRejection', (err: Error) => console.warn(`UNHANDLED REJECTION:\n${err.stack ?? err}`));
process.on('uncaughtException', (err: Error) => {
    console.warn(`UNCAUGHT EXCEPTION:\n${err.stack ?? err}`);
    throw err;
});
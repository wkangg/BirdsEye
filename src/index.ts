import { S3Client } from 'bun';
import express from 'express';
import multer from 'multer';
import bodyParser from 'body-parser';
import { initRoutes } from './routes.ts';

if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    throw new Error('S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be set in .env');
}

export const app: express.Express = express();
export const upload: multer.Multer = multer({ storage: multer.memoryStorage() });
export const r2 = new S3Client({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    bucket: 'snapquest',
    endpoint: 'https://a7c649bdd7eeb9c55573d2f393768828.r2.cloudflarestorage.com'
});

if (app.get('env') === 'production') app.set('trust proxy', 1);

app.use(bodyParser.json());
app.use(express.static('src/public'));

initRoutes();

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`\nlistening on port ${port}\nvisit http://localhost:${port}\n----------------------------`));

process.on('unhandledRejection', (err: Error) => console.warn(`UNHANDLED REJECTION:\n${err.stack ?? err}`));
process.on('uncaughtException', (err: Error) => {
    console.warn(`UNCAUGHT EXCEPTION:\n${err.stack ?? err}`);
    throw err;
});
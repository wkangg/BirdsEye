import { S3Client } from 'bun';
import express from 'express';
import { auth } from 'express-openid-connect';
import multer from 'multer';
import bodyParser from 'body-parser';
// import cron from 'node-cron';
import { setupDB } from './db.ts';
import { initRoutes } from './routes.ts';

if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !process.env.S3_ENDPOINT || !process.env.S3_BUCKET || !process.env.AUTH0_DOMAIN || !process.env.AUTH0_SECRET || !process.env.AUTH0_CLIENT_ID || !process.env.MONGO_DB_URI)
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

app.set('view engine', 'ejs');
app.set('views', 'src/views');
app.use(auth({
    authRequired: false,
    auth0Logout: true,
    baseURL: app.get('env') === 'production' ? 'https://prettyplease.work/' : 'http://localhost:3000',
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    secret: process.env.AUTH0_SECRET
}));
app.use(bodyParser.json());
app.use(express.static('src/public'));
app.get('/', (req, res) => res.render('index', { isLoggedIn: req.oidc.isAuthenticated() }));

setupDB();
initRoutes();

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`\nlistening on port ${port}\nvisit ${app.get('env') === 'production' ? 'https://prettyplease.work/' : 'http://localhost'}:${port}\n----------------------------`));

// async function queryGemini() {
//     fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ contents: [{
//             parts: [{ text: 'Come up with a unique idea for a photo at the University of Toronto, output as JSON with latitude and longitude and your prompt to take a picture at that location. Try to keep the prompt less than 5 words, but still be clear and don\'t give out riddles. Don\'t use words like photograph, take a picture of, capture, show, etc. Just say the topic. Make sure the location coordinates actually make sense for the prompt. Here is an example: {lat: 43.6485, lng: -79.3853, prompt: "Harbourfront"}' }]
//         }] })
//     })
//         .then(async response => {
//             if (!response.ok) console.warn(`HTTP ${response.status}: ${response.statusText}`);
//             const data = await response.json();

//             console.log(data.candidates[0].content);
//         });
// }

// cron.schedule('0 * * * *', () => {
//     console.log('Running hourly Gemini query at', new Date().toISOString());
//     queryGemini();
// });
// queryGemini();

process.on('unhandledRejection', (err: Error) => console.warn(`UNHANDLED REJECTION:\n${err.stack ?? err}`));
process.on('uncaughtException', (err: Error) => {
    console.warn(`UNCAUGHT EXCEPTION:\n${err.stack ?? err}`);
    throw err;
});
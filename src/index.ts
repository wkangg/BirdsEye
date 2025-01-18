import express from 'express';
import bodyParser from 'body-parser';

const app = express();

if (app.get('env') === 'production') app.set('trust proxy', 1);

app.use(express.static('src/public'));
app.use(bodyParser.json());

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`\nlistening on port ${port}\nvisit http://localhost:${port}\n----------------------------`));

process.on('unhandledRejection', (err: Error) => console.warn(`UNHANDLED REJECTION:\n${err.stack ?? err}`));
process.on('uncaughtException', (err: Error) => {
    console.warn(`UNCAUGHT EXCEPTION:\n${err.stack ?? err}`);
    throw err;
});
import './env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import { connectDb } from './db.js';

// To make __dirname available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

const app = fastify();

async function startApp() {
	try {
		app.register(fastifyStatic, {
			root: path.join(__dirname, 'public'),
		});
		// app.get('/', {}, (req, res) => {
		// 	res.send({
		// 		data: 'Hello world!',
		// 	});
		// });
		app.listen(PORT);
		console.log('🚀 Server listening on PORT:', PORT);
	} catch (e) {
		console.error(e);
	}
}

connectDb().then(() => {
	startApp();
});

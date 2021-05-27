import './env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import { connectDb } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';

// To make __dirname available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

const app = fastify();

async function startApp() {
	try {
		// Serve static index.html
		app.register(fastifyStatic, {
			root: path.join(__dirname, 'public'),
		});

		app.post('/api/register', async (req, res) => {
			try {
				const userId = await registerUser(req.body.email, req.body.password);
				res.send({
					data: {
						userId,
					},
				});
			} catch (e) {
				console.error(e);
			}
		});

		app.post('/api/authorize', async (req, res) => {
			try {
				await authorizeUser(req.body.email, req.body.password);
				res.send({
					data: 'hello',
				});
			} catch (e) {
				console.error(e);
			}
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

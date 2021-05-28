import './env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyCookie from 'fastify-cookie';
import { connectDb } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';
import { logUserIn } from './accounts/logUserIn.js';

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

		app.register(fastifyCookie, {
			secret: process.env.COOKIE_SIGNATURE,
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
				const { isAuthorized, userId } = await authorizeUser(req.body.email, req.body.password);
				if (isAuthorized) {
					await logUserIn(userId, req, res);
					res.send({
						data: 'User logged in',
					});
				}
				res.send({
					data: 'Auth failed',
				});
			} catch (e) {
				console.error(e);
			}
		});

		app.get('/test', {}, (req, res) => {
			console.log(req.cookies);
			res.send({
				data: 'Hello world!',
			});
		});

		app.listen(PORT);
		console.log('🚀 Server listening on PORT:', PORT);
	} catch (e) {
		console.error(e);
	}
}

connectDb().then(() => {
	startApp();
});

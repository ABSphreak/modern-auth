import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { fastify } from 'fastify';
import fastifyStatic from 'fastify-static';
import fetch from 'cross-fetch';

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

		app.get('/verify/:email/:token', {}, async (req, res) => {
			try {
				const { email, token } = req.params;
				const values = {
					email,
					token,
				};
				const httpsAgent = new https.Agent({
					rejectUnauthorized: false,
				});
				const response = await fetch('https://api.nodeauth.dev/api/verify', {
					method: 'POST',
					body: JSON.stringify(values),
					credentials: true,
					agent: httpsAgent,
					headers: { 'Content-type': 'application/json; charset=UTF-8' },
				});
				console.log(response.status);
				if (response.status === 200) {
					res.redirect('/');
				}
				res.code(401).send();
			} catch (e) {
				console.error(e);
				res
					.send({
						data: {
							status: 'FAILED',
						},
					})
					.code(500);
			}
		});

		app.get('/reset/:email/:exp/:token', {}, (req, res) => res.sendFile('reset.html'));

		app.get('/2fa', {}, (req, res) => res.sendFile('2fa.html'));

		app.listen(PORT);
		console.log('🚀 Server listening on PORT:', PORT);
	} catch (e) {
		console.error(e);
	}
}

startApp();

import './env.js';
import { fastify } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifyCors from 'fastify-cors';
import { connectDb } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';
import { logUserIn } from './accounts/logUserIn.js';
import { logUserOut } from './accounts/logUserOut.js';
import { changePassword, getUserFromCookies } from './accounts/user.js';
import { mailInit, sendEmail } from './mail/index.js';
import { createVerifyEmailLink, validateVerifyEmail } from './accounts/verify.js';

const PORT = process.env.PORT || 5000;

const app = fastify();

async function startApp() {
	try {
		await mailInit();

		app.register(fastifyCookie, {
			secret: process.env.COOKIE_SIGNATURE,
		});

		app.register(fastifyCors, {
			origin: [/\.nodeauth.dev/, `https://${process.env.ROOT_DOMAIN}`],
			credentials: true,
		});

		app.post('/api/register', {}, async (req, res) => {
			try {
				const userId = await registerUser(req.body.email, req.body.password);
				if (userId) {
					const emailLink = await createVerifyEmailLink(req.body.email);
					await sendEmail({
						to: req.body.email,
						subject: 'Verify your email',
						html: `<a href="${emailLink}">Verify</a>`,
					});
					await logUserIn(userId, req, res);
					res.send({
						data: {
							status: 'SUCCESS',
							userId,
						},
					});
				}
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

		app.post('/api/authorize', {}, async (req, res) => {
			try {
				const { isAuthorized, userId } = await authorizeUser(req.body.email, req.body.password);
				if (isAuthorized) {
					await logUserIn(userId, req, res);
					res.send({
						data: {
							status: 'SUCCESS',
							userId,
						},
					});
				}
				res.send({
					data: 'Auth failed',
				});
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

		app.get('/test', {}, async (req, res) => {
			try {
				const user = await getUserFromCookies(req, res);
				if (user?._id) {
					res.send({
						data: {
							status: 'SUCCESS',
							user,
						},
					});
				} else {
					res.send({
						data: 'User lookup failed',
					});
				}
			} catch (e) {
				res
					.send({
						data: {
							status: 'FAILED',
						},
					})
					.code(500);
			}
		});

		app.post('/api/logout', {}, async (req, res) => {
			try {
				await logUserOut(req, res);
				res.send({
					data: {
						status: 'SUCCESS',
					},
				});
			} catch (e) {
				res
					.send({
						data: {
							status: 'FAILED',
						},
					})
					.code(500);
			}
		});

		app.post('/api/verify', {}, async (req, res) => {
			try {
				const { token, email } = req.body;
				const isValid = await validateVerifyEmail(token, email);
				if (isValid) {
					res.code(200).send();
				}
				res.code(401).send({
					data: 'SUCCESS',
				});
			} catch (e) {
				res
					.send({
						data: {
							status: 'FAILED',
						},
					})
					.code(401);
			}
		});

		app.post('/api/change-password', {}, async (req, res) => {
			try {
				const { oldPassword, newPassword } = req.body;
				const user = await getUserFromCookies(req, res);
				const { isAuthorized, userId } = await authorizeUser(user.email.address, oldPassword);
				if (isAuthorized) {
					// Update in db
					await changePassword(userId, newPassword);
					res.code(200).send('cool');
				} else {
					res.code(401).send();
				}
			} catch (e) {
				res
					.send({
						data: {
							status: 'FAILED',
						},
					})
					.code(401);
			}
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

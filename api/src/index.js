import './env.js';
import { fastify } from 'fastify';
import fastifyCookie from 'fastify-cookie';
import fastifyCors from 'fastify-cors';
import { authenticator } from '@otplib/preset-default';
import { connectDb } from './db.js';
import { registerUser } from './accounts/register.js';
import { authorizeUser } from './accounts/authorize.js';
import { logUserIn } from './accounts/logUserIn.js';
import { logUserOut } from './accounts/logUserOut.js';
import { changePassword, getUserFromCookies, register2FA } from './accounts/user.js';
import { mailInit, sendEmail } from './mail/index.js';
import { createVerifyEmailLink, validateVerifyEmail } from './accounts/verify.js';
import { createResetLink, validateResetEmail } from './accounts/reset.js';

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

		app.get('/api/user', {}, async (req, res) => {
			const user = await getUserFromCookies(req, res);
			if (user) return res.send({ data: { user } });
			res.send({});
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
				const { isAuthorized, userId, authenticatorSecret } = await authorizeUser(req.body.email, req.body.password);
				if (isAuthorized && !authenticatorSecret) {
					await logUserIn(userId, req, res);
					res.send({
						data: {
							status: 'SUCCESS',
							userId,
						},
					});
				} else if (isAuthorized && authenticatorSecret) {
					console.log(isAuthorized && authenticatorSecret);
					res.send({
						data: {
							status: '2FA',
						},
					});
				}
				res.code(401).send({
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

		app.post('/api/reset', {}, async (req, res) => {
			try {
				const { email, password, token, time } = req.body;
				const isValid = await validateResetEmail(token, email, time);
				if (isValid) {
					const { user } = await import('./models/user.js');
					const foundUser = await user.findOne({
						'email.address': email,
					});
					await changePassword(foundUser._id, password);
					res.code(200).send('Password updated');
				}
				res.code(401).send({
					data: 'Reset failed',
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

		app.post('/api/forgot-password', {}, async (req, res) => {
			try {
				const { email } = req.body;
				const link = await createResetLink(email);
				if (link) {
					await sendEmail({
						to: email,
						subject: 'Reset your password',
						html: `<a href="${link}">Reset</a>`,
					});
				}
				res.code(200).send();
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

		app.post('/api/2fa-register', {}, async (req, res) => {
			try {
				const { token, secret } = req.body;
				const user = await getUserFromCookies(req, res);
				const isValid = authenticator.verify({ token, secret });
				if (user._id && isValid) {
					await register2FA(user._id, secret);
					res.send('SUCCESS');
				}
				res.code(401).send();
			} catch (e) {
				console.error(e);
			}
		});

		app.post('/api/verify-2fa', {}, async (req, res) => {
			try {
				const { token, email, password } = req.body;
				const { isAuthorized, userId, authenticatorSecret } = await authorizeUser(email, password);
				const isValid = authenticator.verify({ token, secret: authenticatorSecret });
				if (userId && isValid && isAuthorized) {
					await logUserIn(userId, req, res);
					res.send({
						data: {
							status: 'SUCCESS',
							userId,
						},
					});
				}
				res.code(401).send();
			} catch (e) {
				console.error(e);
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

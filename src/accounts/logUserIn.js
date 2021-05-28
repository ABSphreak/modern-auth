import { createSession } from '../sessions/session.js';
import { createTokens } from '../accounts/tokens.js';

export async function logUserIn(userId, req, res) {
	const connectionInfo = {
		ip: req.ip,
		userAgent: req.headers['user-agent'],
	};

	// Create Sessions
	const sessionToken = await createSession(userId, connectionInfo);
	console.log(sessionToken);

	// Create JWTs
	const { accessToken, refreshToken } = await createTokens(sessionToken, userId);

	const now = new Date();
	const refreshExpires = now.setDate(now.getDate() + 30);
	// Set Cookie
	res
		.setCookie('refreshToken', refreshToken, {
			path: '/',
			domain: 'localhost',
			httpOnly: true,
			expires: refreshExpires,
		})
		.setCookie('accessToken', accessToken, {
			path: '/',
			domain: 'localhost',
			httpOnly: true,
		});
}

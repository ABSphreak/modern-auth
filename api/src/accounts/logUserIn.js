import { createSession } from '../sessions/session.js';
import { refreshTokens } from './user.js';

export async function logUserIn(userId, req, res) {
	const connectionInfo = {
		ip: req.ip,
		userAgent: req.headers['user-agent'],
	};

	// Create Sessions
	const sessionToken = await createSession(userId, connectionInfo);

	await refreshTokens(sessionToken, userId, res);
}

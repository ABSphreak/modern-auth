import { createSession } from '../sessions/session.js';

export async function logUserIn(userId, req, res) {
	const connectionInfo = {
		ip: req.ip,
		userAgent: req.headers['user-agent'],
	};

	// Create Sessions
	const sessionToken = await createSession(userId, connectionInfo);
	console.log(sessionToken);
	// Create JWTs
	// Set Cookie
}

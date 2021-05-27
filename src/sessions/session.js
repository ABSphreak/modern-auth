import { randomBytes } from 'crypto';

export async function createSession(userId, connection) {
	try {
		// Dynamic Import
		const { session } = await import('../models/session.js');

		// Generate a session token
		const sessionToken = randomBytes(43).toString('hex');

		// Retrieve a connection info
		const { ip, userAgent } = connection;

		// Insert session to DB
		await session.insertOne({
			sessionToken,
			userId,
			valid: true,
			userAgent,
			ip,
			updatedAt: new Date(),
			createdAt: new Date(),
		});

		// Return session token
		return sessionToken;
	} catch (e) {
		throw new Error('❌ Session creation failed');
	}
}

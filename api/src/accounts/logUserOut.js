import jwt from 'jsonwebtoken';

const { JWT_SIGNATURE, ROOT_DOMAIN } = process.env;

export async function logUserOut(req, res) {
	try {
		const { session } = await import('../models/session.js');
		// Get refreshToken
		// Decode Refresh Token
		if (req?.cookies?.refreshToken) {
			const { refreshToken } = req.cookies;

			// Decode sessionToken from refreshToken
			const { sessionToken } = jwt.verify(refreshToken, JWT_SIGNATURE);

			// Delete db record for session
			await session.deleteOne({ sessionToken });
		}
		// Remove cookies
		console.log('LOGOUT_RAN');
		res
			.clearCookie('accessToken', {
				path: '/',
				domain: ROOT_DOMAIN,
				httpOnly: true,
				secure: true,
			})
			.clearCookie('refreshToken', {
				path: '/',
				domain: ROOT_DOMAIN,
				httpOnly: true,
				secure: true,
			});
	} catch (e) {
		console.error(e);
	}
}

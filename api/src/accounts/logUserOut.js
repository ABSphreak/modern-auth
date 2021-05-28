import jwt from 'jsonwebtoken';

const JWTSignature = process.env.JWT_SIGNATURE;

export async function logUserOut(req, res) {
	try {
		const { session } = await import('../models/session.js');
		// Get refreshToken
		// Decode Refresh Token
		if (req?.cookies?.refreshToken) {
			const { refreshToken } = req.cookies;

			// Decode sessionToken from refreshToken
			const { sessionToken } = jwt.verify(refreshToken, JWTSignature);

			// Delete db record for session
			await session.deleteOne({ sessionToken });
		}
		// Remove cookies
		console.log('LOGOUT_RAN');
		res.clearCookie('accessToken').clearCookie('refreshToken');
	} catch (e) {
		console.error(e);
	}
}

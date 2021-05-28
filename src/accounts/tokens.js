import jwt from 'jsonwebtoken';

const JWTSignature = process.env.JWT_SIGNATURE;

export async function createTokens(sessionId, userId) {
	try {
		// Create a refresh token - SessionId
		const refreshToken = jwt.sign(
			{
				sessionId,
			},
			JWTSignature
		);

		// Create access token - SessionId, UserId
		const accessToken = jwt.sign(
			{
				sessionId,
				userId,
			},
			JWTSignature
		);

		// return tokens
		return { accessToken, refreshToken };
	} catch (e) {
		console.error(e);
	}
}

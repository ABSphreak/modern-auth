import jwt from 'jsonwebtoken';

const JWTSignature = process.env.JWT_SIGNATURE;

export async function createTokens(sessionToken, userId) {
	try {
		// Create a refresh token - sessionToken
		const refreshToken = jwt.sign(
			{
				sessionToken,
			},
			JWTSignature
		);

		// Create access token - sessionToken, UserId
		const accessToken = jwt.sign(
			{
				sessionToken,
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

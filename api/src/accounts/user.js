import mongo from 'mongodb';
import jwt from 'jsonwebtoken';
import { createTokens } from './tokens.js';

const { ObjectId } = mongo;

const JWTSignature = process.env.JWT_SIGNATURE;

export async function getUserFromCookies(req, res) {
	try {
		// Dynamic Import
		const { user } = await import('../models/user.js');
		const { session } = await import('../models/session.js');

		// Get the access and refresh tokens
		// If access Token
		if (req?.cookies?.accessToken) {
			const { accessToken } = req.cookies;

			// Decode access token
			const decodedAccessToken = jwt.verify(accessToken, JWTSignature);

			// Return user from record
			return user.findOne({
				_id: ObjectId(decodedAccessToken?.userId),
			});
		}

		// Decode Refresh Token
		if (req?.cookies?.refreshToken) {
			const { refreshToken } = req.cookies;

			// Decode refresh token
			const { sessionToken } = jwt.verify(refreshToken, JWTSignature);

			// Look up session
			const currentSession = await session.findOne({
				sessionToken,
			});

			// Confirm if session is valid
			if (currentSession.valid) {
				// Lookup current user
				const currentUser = await user.findOne({
					_id: ObjectId(currentSession.userId),
				});

				// Refresh the tokens
				refreshTokens(sessionToken, currentUser._id, res);

				// Return the user
				return currentUser;
			}
		}
	} catch (e) {
		console.error(e);
	}
}

export async function refreshTokens(sessionToken, userId, res) {
	try {
		// Create JWTs
		const { accessToken, refreshToken } = await createTokens(sessionToken, userId);

		const now = new Date();
		const refreshExpires = now.setDate(now.getDate() + 30);
		// Set Cookie
		res
			.setCookie('refreshToken', refreshToken, {
				path: '/',
				domain: process.env.ROOT_DOMAIN,
				httpOnly: true,
				secure: true,
				expires: refreshExpires,
			})
			.setCookie('accessToken', accessToken, {
				path: '/',
				domain: process.env.ROOT_DOMAIN,
				httpOnly: true,
				secure: true,
			});
	} catch (e) {
		console.error(e);
	}
}

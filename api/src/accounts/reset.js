import crypto from 'crypto';

const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

export function createResetToken(email, timeStamp) {
	try {
		// Reset string, JWT Signatire, email, expTimeStamp
		const resetString = `${JWT_SIGNATURE}:${email}:${timeStamp}`;
		return crypto.createHash('sha256').update(resetString).digest('hex');
	} catch (e) {
		console.error(e);
	}
}

export async function createResetEmailLink(email) {
	try {
		// Encode URL String
		const URIencodedEmail = encodeURIComponent(email);

		// Timestamp
		const expTimeStamp = Date.now() + 24 * 60 * 60 * 1000;

		// Create token
		const emailToken = await createResetToken(email, expTimeStamp);

		// Return email verification string
		return `https://${ROOT_DOMAIN}/reset/${URIencodedEmail}/${expTimeStamp}/${emailToken}`;
	} catch (e) {
		console.error(e);
	}
}

export async function createResetLink(email) {
	try {
		const { user } = await import('../models/user.js');

		const foundUser = await user.findOne({
			'email.address': email,
		});

		if (foundUser) {
			const link = await createResetEmailLink(email);
			return link;
		}
		return '';
	} catch (e) {
		console.error(e);
	}
}

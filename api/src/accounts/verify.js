import crypto from 'crypto';

const { ROOT_DOMAIN, JWT_SIGNATURE } = process.env;

export async function createVerifyEmailToken(email) {
	try {
		// Auth string, JWT Signatire, email
		const authString = `${JWT_SIGNATURE}:${email}`;
		return crypto.createHash('sha256').update(authString).digest('hex');
	} catch (e) {
		console.error(e);
	}
}

export async function createVerifyEmailLink(email) {
	try {
		// Create token
		const emailToken = await createVerifyEmailToken(email);

		// Encode URL String
		const URIencodedEmail = encodeURIComponent(email);

		// Return email verification string
		return `https://${ROOT_DOMAIN}/verify/${URIencodedEmail}/${emailToken}`;
	} catch (e) {
		console.error(e);
	}
}

export async function validateVerifyEmail(token, email) {
	try {
		// Create hash
		const emailToken = await createVerifyEmailToken(email);

		// Compare hash with token
		const isValid = emailToken === token;

		console.log(emailToken === token);

		// If successful, update user to verified
		if (isValid) {
			// Update user
			const { user } = await import('../models/user.js');
			await user.updateOne({ 'email.address': email }, { $set: { 'email.verified': true } });
			// Return success
			return true;
		}
		return false;
	} catch (e) {
		console.error(e);
	}
}

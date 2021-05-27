import bcrypt from 'bcryptjs';

const { compare } = bcrypt;

export async function authorizeUser(email, password) {
	// Dynamic Import
	const { user } = await import('../models/user.js');

	// Lookup user
	const userData = await user.findOne({
		'email.address': email,
	});

	// Get user password
	const savedPassword = userData.password;

	// Compare password to the hash
	const isAuthorized = await compare(password, savedPassword);

	// Return the boolean if authorized
	return isAuthorized;
}

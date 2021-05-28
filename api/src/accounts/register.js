import bcrypt from 'bcryptjs';

const { genSalt, hash } = bcrypt;

export async function registerUser(email, password) {
	// Dynamic Import
	const { user } = await import('../models/user.js');

	// Generate salt
	const salt = await genSalt(10);

	// Hash with salt
	const hashedPassword = await hash(password, salt);

	// Store in DB
	const result = await user.insertOne({
		email: {
			address: email,
			verified: false,
		},
		password: hashedPassword,
	});

	// Return user from DB
	return result.insertedId;
}

import nodemailer from 'nodemailer';

let mail;

export async function mailInit() {
	let testAccount = await nodemailer.createTestAccount();
	let transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: testAccount.user, // generated ethereal user
			pass: testAccount.pass, // generated ethereal password
		},
	});
	mail = transporter;
}

export async function sendEmail({ from = 'matrixphreak@gmail.com', to = 'matrixphreak@gmail.com', subject, html }) {
	try {
		const info = await mail.sendMail({
			from,
			to,
			subject,
			html,
		});

		console.log('Message sent: %s', info.messageId);
		console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		console.log(info);
	} catch (e) {
		console.error(e);
	}
}

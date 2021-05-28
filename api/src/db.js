import mongo from 'mongodb';

const { MongoClient } = mongo;

const url = process.env.MONGO_URI;

export const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

export async function connectDb() {
	try {
		await client.connect();
		await client.db('admin').command({ ping: 1 });
		console.log('🗄  Connected to DB success');
	} catch (e) {
		console.error(e);
		// Close connection if something goes wrong
		await client.close();
	}
}

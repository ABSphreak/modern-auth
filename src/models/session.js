import { client } from '../db.js';

export const session = client.db('modern-auth').collection('session');

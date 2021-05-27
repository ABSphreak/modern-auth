import { client } from '../db.js';

export const user = client.db('modern-auth').collection('user');

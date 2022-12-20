require('dotenv').config();

const urlMongo = process.env.URLMONGO
const secretSession = process.env.SECRETSESSION

module.exports = { urlMongo, secretSession };

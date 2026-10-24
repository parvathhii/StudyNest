import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

const port = process.env.PORT || 5000;

try {
  await connectDB();

  app.listen(port, () => {
    console.log(`StudyNest API listening on port ${port}`);
  });
} catch (error) {
  console.error('Could not start StudyNest API:', error.message);
  process.exit(1);
}

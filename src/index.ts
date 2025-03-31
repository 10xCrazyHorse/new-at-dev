import dotenv from 'dotenv';
import express, { type Request, type Response } from 'express';
import { createDb, migrateToLatest } from '../db';
import { IdResolver } from '@atproto/identity';
import { createIngester } from './ingester';
import { Logger } from './utils/logger';

dotenv.config();

const logger = Logger.create('FEED');
const app = express();
const port = process.env.PORT || 3000;

// Initialize database and ingester
const db = createDb('sqlite.db');
const idResolver = new IdResolver();
const ingester = createIngester(db, idResolver);

// Start ingesting data
ingester.start();

// Ensure database is migrated
migrateToLatest(db).catch((err) => {
  logger.error('Error migrating database:', err);
  process.exit(1);
});

app.get('/', (req: Request, res: Response) => {
  res.send('new@dev feed service');
});

app.get('/.well-known/did.json', (req: Request, res: Response) => {
  res.json({
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: `did:web:${process.env.FEEDGEN_HOSTNAME}`,
    service: [
      {
        id: '#bsky_fg',
        type: 'BskyFeedGenerator',
        serviceEndpoint: `https://${process.env.FEEDGEN_HOSTNAME}`,
      },
    ],
  });
});

app.get(
  '/xrpc/app.bsky.feed.getFeedSkeleton',
  async (req: Request, res: Response) => {
    try {
      // Fetch the most recent posts from the database
      const posts = await db
        .selectFrom('post')
        .select(['uri'])
        .orderBy('createdAt', 'desc')
        .limit(30)
        .execute();

      // Transform the posts into the expected format
      const feed = posts.map((post) => ({
        post: post.uri,
      }));
      logger.debug(`Fetched feed: ${JSON.stringify(feed, null, 2)}`);

      res.json({
        feed,
      });
    } catch (error) {
      logger.error('Error fetching feed:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
);

process.on('SIGINT', async () => {
  logger.debug('Shutting down...');
  await ingester.destroy();
  process.exit(0);
});

app.listen(port, () => {
  logger.info(`service started at http://localhost:${port}`);
  logger.info(`log level: ${process.env.LOG_LEVEL?.toUpperCase() || 'INFO'}`);
});

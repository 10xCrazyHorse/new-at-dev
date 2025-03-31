import type { IdResolver } from '@atproto/identity';
import { Firehose } from '@atproto/sync';
import type { Database } from '../db';
import { Logger } from './utils/logger';
import { createPost } from './lib/api';

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = Logger.create('HOSE');
  logger.info('started firehose listener');

  return new Firehose({
    idResolver,
    handleEvent: async (evt) => {
      // Watch for write events
      if (evt.event === 'create' || evt.event === 'update') {
        const now = new Date();
        const record = evt.record;

        // If the write is a valid status update
        if (evt.collection === 'xyz.statusphere.status') {
          const { alsoKnownAs } = (await idResolver.did.resolve(evt.did)) ?? {};
          const handle = alsoKnownAs?.[0]?.replace('at://', '@');

          logger.info(`new status from ${handle}`);
          logger.debug(JSON.stringify(record, null, 2));

          // Store the status in our SQLite
          await db
            .insertInto('status')
            .values({
              uri: evt.uri.toString(),
              authorDid: evt.did,
              status: record.status,
              createdAt: record.createdAt,
              indexedAt: now.toISOString(),
            })
            .onConflict((oc) =>
              oc.column('uri').doUpdateSet({
                status: record.status,
                indexedAt: now.toISOString(),
              })
            )
            .execute();

          // post to bsky
          const textToPost = `${handle} is feeling ${record.status} today`;
          logger.debug(`posting to bsky: ${textToPost}`);
          const post = await createPost(textToPost);

          // Create a post from the status
          await db
            .insertInto('post')
            .values({
              uri: post.uri.toString(),
              authorDid: evt.did,
              text: textToPost,
              createdAt: record.createdAt,
              indexedAt: now.toISOString(),
            })
            .execute();
          logger.debug(`saved post to db ${evt.uri.toString()}`);
        }
      } else if (
        evt.event === 'delete' &&
        evt.collection === 'xyz.statusphere.status'
      ) {
        // Remove the status from our SQLite
        await db
          .deleteFrom('status')
          .where('uri', '=', evt.uri.toString())
          .execute();
      }
    },
    onError: (err) => {
      logger.error(`firehose ingestion error: ${err}`);
    },
    filterCollections: ['xyz.statusphere.status'],
    excludeIdentity: true,
    excludeAccount: true,
  });
}

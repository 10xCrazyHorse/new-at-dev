import { AtpAgent } from '@atproto/api';
import { Logger } from '../utils/logger';

const logger = Logger.create('API');

export const agent = new AtpAgent({
  service: 'https://bsky.social',
});

export const createPost = async (text: string) => {
  await agent.login({
    identifier: process.env.USERNAME!,
    password: process.env.APP_PASSWORD!,
  });

  const post = await agent.post({
    text,
  });
  logger.debug(`Posted: ${post.uri}`);

  return post;
};

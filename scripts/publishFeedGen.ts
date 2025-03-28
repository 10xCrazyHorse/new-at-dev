import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { AtpAgent, type BlobRef } from '@atproto/api';
import fs from 'node:fs/promises';

const run = async () => {
  dotenv.config();

  if (!process.env.FEEDGEN_HOSTNAME) {
    throw new Error('invalid hostname in the .env file');
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'handle',
      message: 'bluesky handle:',
      required: true,
    },
    {
      type: 'password',
      name: 'password',
      message: 'bluesky app password:',
    },
    {
      type: 'input',
      name: 'service',
      message: 'optional custom PDS service to sign in with:',
      default: 'https://bsky.social',
      required: false,
    },
    {
      type: 'input',
      name: 'recordName',
      message: "short name that will be shown in the feed's URL:",
      default: 'min-feed',
      required: true,
    },
    {
      type: 'input',
      name: 'displayName',
      message: 'display name for your feed:',
      default: 'Minimum Feed',
      required: true,
    },
    {
      type: 'input',
      name: 'description',
      message: 'optional brief description of your feed:',
      default: 'statusphere interactions feed',
      required: false,
    },
    {
      type: 'input',
      name: 'avatar',
      message: 'optional local path to an avatar for the feed logo:',
      required: false,
    },
  ]);

  const {
    handle,
    password,
    recordName,
    displayName,
    description,
    avatar,
    service,
  } = answers;

  const feedGenDid = `did:web:${process.env.FEEDGEN_HOSTNAME}`;

  // only update this if in a test environment
  const agent = new AtpAgent({
    service: service ? service : 'https://bsky.social',
  });
  await agent.login({ identifier: handle, password });

  let avatarRef: BlobRef | undefined;
  if (avatar) {
    let encoding: string;
    if (avatar.endsWith('png')) {
      encoding = 'image/png';
    } else if (avatar.endsWith('jpg') || avatar.endsWith('jpeg')) {
      encoding = 'image/jpeg';
    } else {
      throw new Error('expected png or jpeg');
    }
    const img = await fs.readFile(avatar);
    const blobRes = await agent.uploadBlob(img, {
      encoding,
    });
    avatarRef = blobRes.data.blob;
  }

  await agent.com.atproto.repo.putRecord({
    repo: agent.session?.did ?? '',
    collection: 'app.bsky.feed.generator',
    rkey: recordName,
    record: {
      did: feedGenDid,
      displayName: displayName,
      description: description,
      avatar: avatarRef,
      createdAt: new Date().toISOString(),
    },
  });

  console.log('All done 🎉');
};

run();

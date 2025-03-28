# Statusphere Feed Generator

## Overview

A minimal feed generator in TypeScript that filters the firehose for statusphere collection events and posts to a delegated account the status as a post type as the feed at bsky.app does not consume arbitrary types. New developers interacting with atproto quickstart demo app statusphere will make this feed. It also serves as a showcase to help new@devs understand deploying custom feeds


## Getting Started
Clone repo run `bun install` copy [.env.example](.env.example) to `.env` update the values and run `bun dev`


`FEEDGEN_HOSTNAME` must be set to `bun run publishFeed`

**DEPLOYMENT**

`bun run build` and deploy the `/dist` folder to your server


**TEST LOCAL PUBLISH**

Install [ngrok](https://download.ngrok.com) and run `ngrok http 3000`

Save the url without "https" as `FEEDGEN_HOSTNAME` in your `.env`

and run `bun run start`

Make sure the server is running correctly:

- http://localhost:3000
- http://localhost:3000/.well-known/did.json
- http://localhost:3000/xrpc/app.bsky.feed.getFeedSkeleton

**PUBLISH**

Remember that you must set `FEEDGEN_HOSTNAME` in `.env` to the ngrok generated hostname if testing locally or the domain host of your server 

`bun run publishFeed` and follow the prompts

&nbsp;

Go to your Profile on bsky.app and find your feed in the Feeds tab

`bun run unpublishFeed` and follow prompts to remove your feed
import { json, urlencoded } from 'body-parser';
import * as dotenv from 'dotenv';
dotenv.config();
import express, { Request } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import axios from 'axios';

import MOCKED_CLAIMS from './mocks/claims';

const PORTABL_API_DOMAIN = process.env.PORTABL_API_DOMAIN;
const PORTABL_CLIENT_ID = process.env.PORTABL_CLIENT_ID;
const PORTABL_CLIENT_SECRET = process.env.PORTABL_CLIENT_SECRET;

let ACCESS_TOKEN: string;

if (typeof PORTABL_CLIENT_ID !== 'string') {
  throw new Error('No CLIENT_ID was provided in .env');
}

if (typeof PORTABL_CLIENT_SECRET !== 'string') {
  throw new Error('No CLIENT_SECRET was provided in .env');
}

const baseUrl = `${PORTABL_API_DOMAIN}/api/v1`;

const getUserIdFromRequest = (req: Request) => {
  const auth = req.headers.authorization;
  if (!auth) {
    throw new Error('Unauthorized');
  }

  const [, token] = auth.split(' ');
  return Buffer.from(token, 'base64').toString();
};

export const createServer = () => {
  const app = express();
  app
    .disable('x-powered-by')
    .use(morgan('dev'))
    .use(urlencoded({ extended: true }))
    .use(json())
    .use(cors())
    .use(async (req, res, next) => {
      if (!ACCESS_TOKEN) {
        try {
          const response = await axios.post(`${baseUrl}/provider/token`, {
            clientId: PORTABL_CLIENT_ID,
            clientSecret: PORTABL_CLIENT_SECRET,
          });

          ACCESS_TOKEN = response.data.accessToken;
          next();
        } catch (e) {
          console.log('ERROR', e);
          next(e);
        }
      } else {
        next();
      }
    })
    .get('/sync-context', async (req, res, next) => {
      try {
        const userId = getUserIdFromRequest(req);

        const { data: context } = await axios.get(`${baseUrl}/provider/users/${userId}/sync-context`, {
          headers: {
            authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        });

        return res.json(context);
      } catch (e) {
        next(e);
      }
    })
    .post('/prepare-sync', async (req, res, next) => {
      try {
        // Pick User ID
        //  - Pick an identifier that will serve as a unique external user id within Portabl Core™ API;
        //  - Subject to implementation of your auth server, you might consider passing and validating you native auth params, and derive a user id from them;
        const userId = getUserIdFromRequest(req);

        // Integrate [Update or Create a User](https://docs.getportabl.com/api-ref#update-or-create-a-user) endpoint
        //  - You shall enable data syncronization for a user by passing the following request body:
        //    - `{ settings: { isSyncOn: true } }`
        //  - If user is not found by (linked to) your Portabl account yet, it will create user in (link to) your Portabl account;
        //  - Otherwise, if user is found, it will update user settings and set data syncronization flag to true;
        await axios.put(
          `${baseUrl}/provider/users/${userId}`,
          { settings: { isSyncOn: true } },
          { headers: { authorization: `Bearer ${ACCESS_TOKEN}` } },
        );

        // Integrate [Create User Invitation](https://docs.getportabl.com/api-ref#create-user-invitation) endpoint
        //  - Creates a user invitation url in case a secure connection with a given user has not yet been established;
        //    - e.g. `{ isAlreadyConnected: false, invitationUrl: 'https://api.getportabl.com/connect?_oob=eyJ...xfQ' }`
        //  - This invitation shall be accepted by a given user to establish a secure connection;
        //  - Once established, this connection can be used to securely deliver messages between SSI agents for data synchronization;
        //  - If a secure connection with a given user is already establish then "isAlreadyConnected" in the response body will be set to true, and no invitation url will be returned
        //    - e.g. `{ isAlreadyConnected: true }`
        const { data: providerCreateSyncInviteResponse } = await axios.post(
          `${baseUrl}/provider/users/${userId}/invite`,
          {},
          { headers: { authorization: `Bearer ${ACCESS_TOKEN}` } },
        );

        // Fetch user's identity claims from internal API(s)
        const claims = MOCKED_CLAIMS;

        // Integrate [Patch User Claims](https://docs.getportabl.com/api-ref#patch-user-claims) endpoint
        // - Patches claims of a user;
        // - By default, patching user claims will start the data synchronization process;
        // - To disable this behaviour and control when data synchronization should start you can provide "noAutoSync=false" in your query params;
        await axios.patch(
          `${baseUrl}/provider/users/${userId}/claims`,
          { claims },
          { headers: { authorization: `Bearer ${ACCESS_TOKEN}` } },
        );

        // Integrate [Start User Data Sync (Manual Trigger)](https://docs.getportabl.com/api-ref#patch-user-claims) endpoint
        //  - It manually kicks-off data synchronization process over a previously established secure connection;
        //  - It can be useful for providers with distributed systems that do not want to rely on automatic data synchronization and have greater control;
        //  - It allows to batch claim patches together and manually trigger data synchronization by request;
        // await axios.post(
        //   `${baseUrl}/provider/users/${userId}/sync`,
        //   {},
        //   { headers: { authorization: `Bearer ${ACCESS_TOKEN}` } },
        // );

        const { isLinked, invitationUrl } = providerCreateSyncInviteResponse;

        return res.json({
          isLinked,
          invitationUrl,
        });
      } catch (error) {
        console.error('error', error);
        next(error);
      }
    })
    .get('/healthz', (_, res) => {
      return res.json({ ok: true });
    });

  return app;
};

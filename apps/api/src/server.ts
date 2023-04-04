import { json, urlencoded } from 'body-parser';
import * as dotenv from 'dotenv';
dotenv.config();
import express, { Request } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import axios from 'axios';

import MOCKED_DATAPOINTS from './mocks/claims';

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
          console.log(ACCESS_TOKEN);
          next();
        } catch (e) {
          console.log('ERROR', e);
          next(e);
        }
      } else {
        next();
      }
    })
    .get('/sync-prereqs', async (req, res, next) => {
      try {
        const userId = getUserIdFromRequest(req);
        const {
          data: { settings },
        } = await axios.get(`${baseUrl}/provider/users/${userId}/settings`, {
          headers: {
            authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        });

        const {
          data: { datapoints },
        } = await axios.get(`${baseUrl}/provider/data-profiles/latest/datapoints`, {
          headers: {
            authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        });

        return res.json({
          isSyncOn: settings?.isSyncOn || false,
          datapoints,
        });
      } catch (e) {
        next(e);
      }
    })
    .post('/user-consent', async (req, res, next) => {
      try {
        const userId = getUserIdFromRequest(req);
        await axios.put(
          `${baseUrl}/provider/users/${userId}/settings`,
          {
            isSyncOn: true,
          },
          {
            headers: {
              authorization: `Bearer ${ACCESS_TOKEN}`,
            },
          },
        );

        // Make a request to get claims from internal APIs
        const datapoints = MOCKED_DATAPOINTS;

        // Make a request to get the native user id from internal APIs
        await axios.put(
          `${baseUrl}/provider/users/${userId}/datapoints`,
          {
            datapoints,
          },
          {
            headers: {
              authorization: `Bearer ${ACCESS_TOKEN}`,
            },
          },
        );

        const { data } = await axios.post(
          `${baseUrl}/provider/users/${userId}/sync-sessions`,
          {},
          {
            headers: {
              authorization: `Bearer ${ACCESS_TOKEN}`,
            },
          },
        );

        const { syncSessionId } = data;

        async () => {
          axios.post(`${baseUrl}/provider/sync-sessions/${syncSessionId}/start`, {
            headers: {
              authorization: `Bearer ${ACCESS_TOKEN}`,
            },
          });
        };

        return res.json({});
      } catch (e) {
        next(e);
      }
    })
    .get('/healthz', (_, res) => {
      return res.json({ ok: true });
    });

  return app;
};

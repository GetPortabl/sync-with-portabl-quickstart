import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

const API_BASE_URL = window._env_.JS_APP_PUBLIC_API_HOST;
const CLIENT_ID = window._env_.JS_APP_PUBLIC_PORTABL_PUBLIC_CLIENT_ID;
const DOMAIN = window._env_.JS_APP_AUTH0_DOMAIN;
const AUDIENCE = window._env_.JS_APP_AUTH0_API_AUDIENCE;
const PASSPORT_URL = window._env_.JS_APP_PUBLIC_PASSPORT_URL;
const SYNC_ACCEPT_URL = window._env_.JS_APP_PUBLIC_SYNC_ACCEPT_URL;
const USER_CONSENT = '/user-consent';
const SYNC_PREREQS = '/sync-prereqs';

// used for playground purposes only
let MOCK_USER_ID = localStorage.getItem('MOCK_USER_ID');
if (!MOCK_USER_ID) {
  MOCK_USER_ID = uuidv4();
  localStorage.setItem('MOCK_USER_ID', MOCK_USER_ID);
}

async function initPortabl(mockUserId) {
  let MOCK_HEADERS_WITH_AUTH = { Authorization: `Basic ${window.btoa(mockUserId)}` };

  // when user generates a new user id, clearing the previous instance for playground purposes
  const rootNode = document.querySelector('#portabl-sync-root');
  if (rootNode) {
    rootNode.innerHTML = '';
  }

  await Portabl.createSyncWithPortabl({
    envOverride: {
      domain: DOMAIN,
      audience: AUDIENCE,
      passportUrl: PASSPORT_URL,
      syncAcceptUrl: SYNC_ACCEPT_URL,
    },
    rootSelector: '#portabl-sync-root',
    clientId: CLIENT_ID,
    getPrereqs: async () => {
      const { data } = await axios.get(`${API_BASE_URL}${SYNC_PREREQS}`, {
        headers: MOCK_HEADERS_WITH_AUTH,
      });
      return data;
    },
    onUserConsent: async () => {
      const { data } = await axios.post(
        `${API_BASE_URL}${USER_CONSENT}`,
        {},
        {
          headers: MOCK_HEADERS_WITH_AUTH,
        },
      );

      return data.invitationUrl;
    },
  });

  // used to reset the user id for playground purposes only
  window.generateNewUserId = async function () {
    const newMockUserId = uuidv4();
    localStorage.setItem('MOCK_USER_ID', newMockUserId);
    MOCK_USER_ID = newMockUserId;
    await initPortabl(MOCK_USER_ID);
  };
}

await initPortabl(MOCK_USER_ID);
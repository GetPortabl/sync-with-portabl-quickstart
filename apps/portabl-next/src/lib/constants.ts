export const THEME = process.env.NEXT_PUBLIC_THEME || 'dark';
export const PROVIDER_NAME = process.env.NEXT_PUBLIC_PROVIDER_NAME || 'BankTrust';

export const PORTABL_API_DOMAIN = process.env.PORTABL_API_DOMAIN;
export const PORTABL_CLIENT_ID = process.env.PORTABL_CLIENT_ID || '';
export const PORTABL_CLIENT_SECRET = process.env.PORTABL_CLIENT_SECRET || '';

export const PORTABL_VERIFICATION_CLIENT_ID = process.env.PORTABL_VERIFICATION_CLIENT_ID || '';
export const PORTABL_VERIFICATION_CLIENT_SECRET = process.env.PORTABL_VERIFICATION_CLIENT_SECRET || '';

export const BASE_URL = `${PORTABL_API_DOMAIN}/api/v1` as const;
export const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const PORTABL_ACCOUNT_ID = process.env.NEXT_PUBLIC_PORTABL_ACCOUNT_ID || '';
export const PORTABL_VERIFY_ISSUE_AUTH_PROJECT_ID = process.env.NEXT_PUBLIC_PORTABL_VERIFY_ISSUE_AUTH_PROJECT_ID || '';
export const PORTABL_VERIFY_ISSUE_PROJECT_ID = process.env.NEXT_PUBLIC_PORTABL_VERIFY_ISSUE_PROJECT_ID || '';
export const PORTABL_CONNECT_DOMAIN = process.env.NEXT_PUBLIC_PORTABL_CONNECT_DOMAIN || '';
export const PORTABL_WALLET_DOMAIN = process.env.NEXT_PUBLIC_PORTABL_WALLET_DOMAIN || '';

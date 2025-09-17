import {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	MICROSOFT_CLIENT_ID,
	MICROSOFT_CLIENT_SECRET,
	MICROSOFT_TENANT_ID
} from '$env/static/private';
import { Google, MicrosoftEntraId } from 'arctic';

export const google = new Google(
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	'http://localhost:5173/login/google/callback'
);

export const microsoft = new MicrosoftEntraId(
	MICROSOFT_TENANT_ID,
	MICROSOFT_CLIENT_ID,
	MICROSOFT_CLIENT_SECRET,
	'http://localhost:5173/login/microsoft/callback'
);

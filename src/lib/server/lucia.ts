import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { dev } from '$app/environment';
import { planetscale } from '@lucia-auth/adapter-mysql';
import { connect } from '@planetscale/database';
import {
	PRIVATE_DATABASE_HOST,
	PRIVATE_DATABASE_USERNAME,
	PRIVATE_DATABASE_PASSWORD
} from '$env/static/private';

const connection = connect({
	host: PRIVATE_DATABASE_HOST,
	username: PRIVATE_DATABASE_USERNAME,
	password: PRIVATE_DATABASE_PASSWORD
});

// expect error
export const auth = lucia({
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	adapter: planetscale(connection, {
		user: 'users',
		key: 'user_keys',
		session: 'user_sessions'
	}),
	getUserAttributes: (data) => {
		return {
			username: data.username,
			email: data.email
		};
	}
});

export type Auth = typeof auth;

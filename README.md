# create-po-app

This Read-me's intention is to show you how to setup [`SvelteKit`](https://kit.svelte.dev/) project with [`Drizzle`](https://drizzle.team/) + [`PlanetScale`](https://planetscale.com/) for backend and [`Lucia-auth`](https://lucia-auth.com/) for authentication. (Optional: [`TailwindCSS`](https://tailwindcss.com/))

Let get started!!!

note: this project, i'm going to use pnpm

## Setup Sveltekit Project

First open your terminal and cd into wherever you want your project to be. Then, run:

```bash
pnpm create svelte@latest <your-project-name>
```

- please replace <your-project-name> with the name you want
- Choose answer like below:
  - Skeleton project
  - Yes, using TypeScript syntax
  - Checked all 4 options
    - Add ESLint for code linting
    - Add Prettier for code formatting
    - Add Playwright for browser testing
    - Add Vitest for unit testing


    
## Add TailwindCSS

> This step is optional, meaning you don't have to but i recommended to learn using tailwindcss.

after you finished setup Sveltekit project:
- cd to your project
- and run:

```bash
pnpx svelte-add@latest tailwindcss
```

after this you would want to go into your text-editor of choice and open terminal inside your text-editor and run:

```bash
pnpm run dev
```



## Drizzle + PlanetScale

Now for the fun part.

### 1. Config `.env` file

1. First, you need to create your project in [`PlanetScale`](https://planetscale.com/)
2. Click 'Connect'
3. Choose Connect with: `@planetscale/database`
4. Copy the code
5. Go back to your text-editor
6. in the root directory, create a new file called `.env`
7. paste the code that you copied to `.env` file
8. add `PRIVATE_` before each one. It looks something like this:
   
```
PRIVATE_DATABASE_HOST=*****
PRIVATE_DATABASE_USERNAME=*****
PRIVATE_DATABASE_PASSWORD=*****
```


----
----
### 2. Install Drizzle and PlanetScale

go to your terminal and run

```bash
pnpm add drizzle-orm @planetscale/database
pnpm add -D drizzle-kit
```


----
----
### 3. Config `drizzle.config.ts` file

1. in the root directory, create a new file called `drizzle.config.ts`
2. copy and paste this code in that file:

```
import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	driver: 'mysql2',
	dbCredentials: {
		database: <your-database-name>,
		connectionString: <your-database-url>
	}
} satisfies Config;
```
- to get your `database's name`:
  - go to PlanetScale's console
  - copy the name of your project

- to get your `database's url`:
  - go to PlanetScale's console
  - Click 'Connect'
  - Choose Connect with: `Prisma`
  - Copy only `url`, without the DATABASE_URL=
  - at the end of url, replace `?sslaccept=strict` with `?ssl={"rejectUnauthorized":true}`

3. then go to `.gitignore` file, and add one this line:
```
drizzle.config.ts
```


----
----
### 4. Setup Backend

1. Copy and paste these code below in their respected directory

`src/lib/server/db/schema.ts`
```
// src/lib/server/db/schema.ts

import { mysqlTable, bigint, varchar } from 'drizzle-orm/mysql-core';

export const user = mysqlTable('users', {
	id: varchar('id', {
		length: 15 // change this when using custom user ids
	}).primaryKey(),
	username: varchar('username', { length: 32 }).notNull(),
	email: varchar('email', { length: 100 }).notNull()
	// other user attributes
});

export const userKeys = mysqlTable('user_keys', {
	id: varchar('id', { length: 255 }).primaryKey().notNull(),
	user_id: varchar('user_id', { length: 15 }).notNull(),
	hashedPassword: varchar('hashed_password', { length: 255 })
});

export const userSessions = mysqlTable('user_sessions', {
	id: varchar('id', { length: 127 }).primaryKey().notNull(),
	user_id: varchar('user_id', { length: 15 }).notNull(),
	activeExpires: bigint('active_expires', { mode: 'number' }).notNull(),
	idleExpires: bigint('idle_expires', { mode: 'number' }).notNull()
});

```
----
`src/lib/index.ts`
```
// src/lib/index.ts

import { drizzle } from 'drizzle-orm/planetscale-serverless';
import * as schema from '$lib/server/db/schema';
import { connect } from '@planetscale/database';
import {
	PRIVATE_DATABASE_HOST,
	PRIVATE_DATABASE_USERNAME,
	PRIVATE_DATABASE_PASSWORD
} from '$env/static/private';

// create the connection
const connection = connect({
	host: PRIVATE_DATABASE_HOST,
	username: PRIVATE_DATABASE_USERNAME,
	password: PRIVATE_DATABASE_PASSWORD
});

const db = drizzle(connection, { schema });
```

2. Error expected. to fix this, run:
```bash
pnpm run check
```

3. After that, add 2 scripts to `package.json`
```
"scripts": {
	"migrations": "npx drizzle-kit generate:mysql",
	"db-push": "npx drizzle-kit push:mysql",
	...
},
```

now try run these in your terminal:
```bash
pnpm run migrations
pnpm run db-push
```


----
----
### 5. Setup Lucia-auth

>Note that this example is going to use email-and-password authentication

1. Starting off, go to terminal and run:
```bash
pnpm add lucia
```
2. since we use PlanetScale, we also need to run:
```bash
pnpm add @lucia-auth/adapter-mysql
```

3. create new file called `lucia.ts` in src/lib/server folder, then copy/paste this code:
```
// src/lib/server/lucia.ts

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
```

4. go to `app.d.ts` and replace original code with this:
```
declare global {
	namespace App {
		interface Locals {
			auth: import('lucia').AuthRequest;
		}
	}
	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type DatabaseUserAttributes = {
			username: string;
			email: string;
		};
		// type DatabaseSessionAttributes = {};
	}
}

export {};
```

5. create new file called `hooks.server.ts` in src folder, then copy/paste this code:
```
import { auth } from '$lib/server/lucia';

import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// we can pass `event` because we used the SvelteKit middleware

	event.locals.auth = auth.handleRequest(event);

	return await resolve(event);
};
```

> sidenode: if you encounter any error so far, try running `pnpm run check`.

6. try to check if you setup correctly by go to your terminal and run:
```
pnpm drizzle-kit studio
```

----
----
### 6. Build Email-and-Password Authentication

`src/routes/+page.server.ts`
```
// src/routes/+page.server.ts

import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/auth/login');
	return {
		email: session.user.email,
		userId: session.user.userId,
		username: session.user.username
	};
};

export const actions: Actions = {
	logout: async ({ locals }) => {
		const session = await locals.auth.validate();
		if (!session) return fail(401);
		await auth.invalidateSession(session.sessionId); // invalidate session
		locals.auth.setSession(null); // remove cookie
		throw redirect(302, '/auth/login'); // redirect to login page
	}
};

```
----
`src/routes/+page.svelte`
```
// src/routes/+page.svelte

<script lang="ts">
	import { enhance } from '$app/forms';

	import type { PageData } from './$types';

	export let data: PageData;
</script>

<h1>Profile</h1>

<p>Email: {data.email}</p>

<p>User id: {data.userId}</p>

<p>Username: {data.username}</p>

<form method="post" action="?/logout" use:enhance>
	<input type="submit" value="Sign out" />
</form>
```
----
1. now create new folder called `auth`
2. then create 2 folders inside auth called: `signup` and `login`
3. create `+page.server.ts` and `+page.svelte` for each folder
4. copy and paste codes below:

#### Sign Up
`src/routes/auth/signup/+page.server.ts`
```
// src/routes/auth/signup/+page.server.ts

import { auth } from '$lib/server/lucia';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();

		const username = formData.get('username');

		const password = formData.get('password');

		const email = formData.get('email') as string;

		// basic check

		if (typeof username !== 'string' || username.length < 4 || username.length > 31) {
			return fail(400, {
				message: 'Invalid username'
			});
		}

		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
			});
		}

		try {
			const user = await auth.createUser({
				key: {
					providerId: 'username', // auth method

					providerUserId: username.toLowerCase(), // unique id when using "username" auth method

					password // hashed by Lucia
				},

				attributes: {
					username,

					email
				}
			});

			const session = await auth.createSession({
				userId: user.userId,

				attributes: {}
			});

			locals.auth.setSession(session); // set session cookie
		} catch (e: any) {
			// this part depends on the database you're using

			// check for unique constraint error in user table

			return fail(500, {
				message: 'An unknown error occurred'
			});
		}

		// redirect to

		// make sure you don't throw inside a try/catch block!

		throw redirect(302, '/');
	}
};
```

----
`src/routes/auth/signup/+page.svelte`
```
// src/routes/auth/signup/+page.svelte

<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<h1>Sign up</h1>
<form method="post" use:enhance>
	<label for="username">email</label>
	<input name="email" id="email" /><br />
	<label for="username">Username</label>
	<input name="username" id="username" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/auth/login">Login</a>
```

#### Log In
`src/routes/auth/login/+page.server.ts`
```
// src/routes/auth/login/+page.server.ts

import { auth } from '$lib/server/lucia';
import { LuciaError } from 'lucia';
import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		// basic check
		if (typeof username !== 'string' || username.length < 1 || username.length > 31) {
			return fail(400, {
				message: 'Invalid username'
			});
		}
		if (typeof password !== 'string' || password.length < 1 || password.length > 255) {
			return fail(400, {
				message: 'Invalid password'
			});
		}
		try {
			// find user by key
			// and validate password
			const user = await auth.useKey('username', username.toLowerCase(), password);
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
			) {
				// user does not exist
				// or invalid password
				return fail(400, {
					message: 'Incorrect username of password'
				});
			}
			return fail(500, {
				message: 'An unknown error occurred'
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, '/');
	}
};
```

----
`src/routes/auth/login/+page.svelte`
```
// src/routes/auth/login/+page.svelte

<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<h1>Sign up</h1>
<script lang="ts">
	import { enhance } from '$app/forms';
</script>

<h1>Login</h1>
<form method="post" use:enhance>
	<label for="username">Username</label>
	<input name="username" id="username" /><br />
	<label for="password">Password</label>
	<input type="password" name="password" id="password" /><br />
	<input type="submit" />
</form>
<a href="/auth/signup">Create an account</a>
```
----
> Congrats, you have sucessfully create a working authenticated sveltekit application



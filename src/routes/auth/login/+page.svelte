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

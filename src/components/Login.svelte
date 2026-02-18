<script>
  import { pb } from '../lib/pb.svelte.js'
  import { runTask } from '../lib/async'

  let { onSuccess = () => {} } = $props()

  let username = $state('')
  let password = $state('')
  let loginError = $state('')
  let busy = $state(false)

  const setBusy = (value) => {
    busy = value
  }

  const setError = (message) => {
    loginError = message
  }

  const login = async () => {
    await runTask(
      async () => {
        await pb.collection('users').authWithPassword(username, password)
        username = ''
        password = ''
        onSuccess()
      },
      {
        setBusy,
        setError,
        errorMessage: 'Login failed.'
      }
    )
  }
</script>

<h1>Sign in</h1>
<p class="sub">Use your PocketBase username and password.</p>
<form
  class="form"
  onsubmit={(event) => {
    event.preventDefault()
    login()
  }}
>
  <div>
    <label for="username">Username or email</label>
    <input
      id="username"
      class="auth-input"
      type="text"
      bind:value={username}
      autocomplete="username"
    />
  </div>
  <div>
    <label for="password">Password</label>
    <input
      id="password"
      class="auth-input"
      type="password"
      bind:value={password}
      autocomplete="current-password"
    />
  </div>
  {#if loginError}
    <small class="error">{loginError}</small>
  {/if}
  <button class="auth-button" type="submit" disabled={busy}>
    Login
    <svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  </button>
</form>

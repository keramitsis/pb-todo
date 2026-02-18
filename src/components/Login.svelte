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

<section class="auth-view">
  <header class="auth-header">
    <p class="auth-kicker">TASK DASHBOARD</p>
    <h1 class="auth-title">Sign in</h1>
  </header>
<form
  class="auth-form"
  onsubmit={(event) => {
    event.preventDefault()
    login()
  }}
>
  <div class="auth-field">
    <label for="username" class="auth-label">Email</label>
    <div class="auth-input-wrap">
      <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 6h16v12H4z" />
        <path d="M4 7l8 6 8-6" />
      </svg>
      <input
        id="username"
        class="auth-input"
        type="email"
        bind:value={username}
        autocomplete="username"
        placeholder="name@example.com"
      />
    </div>
  </div>
  <div class="auth-field">
    <label for="password" class="auth-label">Password</label>
    <div class="auth-input-wrap">
      <svg class="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </svg>
      <input
        id="password"
        class="auth-input"
        type="password"
        bind:value={password}
        autocomplete="current-password"
        placeholder="••••••••"
      />
    </div>
  </div>
  {#if loginError}
    <small class="error">{loginError}</small>
  {/if}
  <button class="auth-button" type="submit" disabled={busy}>
    <span class="auth-button-label">Sign In</span>
    <svg
      class="icon auth-button-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 5l7 7-7 7" />
      <path d="M4 12h11" />
    </svg>
  </button>
</form>
</section>

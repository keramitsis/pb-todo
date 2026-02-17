<script>
  import { auth, pb } from './lib/pb'
  const avatarUrl = (record) => (record?.avatar ? pb.files.getUrl(record, record.avatar) : '')
  import Login from './components/Login.svelte'
  import TodoList from './components/TodoList.svelte'

  const logout = () => pb.authStore.clear()
</script>

<main>
  <div class="card">
    {#if !$auth.valid}
      <Login />
    {:else}
      <div class="row space">
        <div>
          <h1>Your todos</h1>
          <p class="sub">
            Signed in as
            {#if $auth.record?.avatar}
              <img class="avatar" src={avatarUrl($auth.record)} alt="User avatar" />
            {/if}
            <strong>{$auth.record?.username ?? $auth.record?.email ?? 'unknown'}</strong>
          </p>
        </div>
        <button class="secondary icon-button" on:click={logout}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Logout
        </button>
      </div>

      <TodoList userId={$auth.record?.id} />
    {/if}
  </div>
</main>

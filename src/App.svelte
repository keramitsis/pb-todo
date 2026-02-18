<script>
  import { onMount } from 'svelte'
  import { auth, pb } from './lib/pb.svelte.js'
  import Login from './components/Login.svelte'
  import TodoList from './components/TodoList.svelte'

  let menuOpen = $state(false)
  let menuRef = $state(null)

  const avatarUrl = (record) => (record?.avatar ? pb.files.getUrl(record, record.avatar) : '')
  const displayName = () => auth.record?.username ?? auth.record?.email ?? 'Unknown'
  const initial = () => displayName().trim().charAt(0).toUpperCase() || '?'

  const toggleMenu = () => {
    menuOpen = !menuOpen
  }

  const closeMenu = () => {
    menuOpen = false
  }

  const logout = () => pb.authStore.clear()

  onMount(() => {
    const onDocumentClick = (event) => {
      if (!menuOpen) return
      if (menuRef && !menuRef.contains(event.target)) {
        closeMenu()
      }
    }

    window.addEventListener('click', onDocumentClick)
    return () => window.removeEventListener('click', onDocumentClick)
  })
</script>

<main class:todo-main={auth.valid}>
  <div class={`card ${auth.valid ? 'todo-screen' : ''}`}>
    {#if !auth.valid}
      <Login />
    {:else}
      <div class="header">
        <div>
          <h1>My Tasks</h1>
        </div>
        <div class="profile-menu" bind:this={menuRef}>
          <button
            class="avatar-trigger"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Open profile menu"
            onclick={toggleMenu}
          >
            {#if auth.record?.avatar}
              <img class="avatar" src={avatarUrl(auth.record)} alt="User avatar" />
            {:else}
              <span class="avatar avatar-fallback" aria-hidden="true">{initial()}</span>
            {/if}
          </button>
          {#if menuOpen}
            <div class="menu-dropdown" role="menu">
              <p class="menu-meta">
                Signed in as <strong>{displayName()}</strong>
              </p>
              <button class="menu-item" role="menuitem" onclick={logout}>
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Logout
              </button>
            </div>
          {/if}
        </div>
      </div>

      <TodoList userId={auth.record?.id} />
    {/if}
  </div>
</main>

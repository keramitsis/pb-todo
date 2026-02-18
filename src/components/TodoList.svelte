<script>
  import { onMount } from 'svelte'
  import { runTask } from '../lib/async'
  import { createTodo, deleteTodo, getTodo, listTodos, updateTodo } from '../lib/todos'
  import {
    enqueueAction,
    isOnline,
    loadCachedTodos,
    processQueue,
    saveCachedTodos
  } from '../lib/offline'
  import TodoItem from './TodoItem.svelte'

  let { userId = null } = $props()

  let newTitle = $state('')
  let todos = $state([])
  let loadError = $state('')
  let loadingTodos = $state(false)
  let busy = $state(false)
  let editingId = $state(null)
  let editingTitle = $state('')
  let suppressBlurSave = $state(false)
  let currentUserId = $state(null)
  let draggingId = $state(null)
  let dragOverId = $state(null)
  let dragOverPosition = $state(null)
  let reorderId = $state(null)
  let online = $state(true)
  let offlineNotice = $state('')
  let conflictNotice = $state('')

  const setBusy = (value) => {
    busy = value
  }

  const setError = (message) => {
    loadError = message
  }

  const loadTodos = async () => {
    if (!userId) return
    loadingTodos = true
    await runTask(
      async () => {
        todos = await listTodos(userId)
        saveCachedTodos(userId, todos)
      },
      {
        setBusy: null,
        setError,
        errorMessage: 'Failed to load todos.'
      }
    )
    loadingTodos = false
  }

  const addTodo = async () => {
    const title = newTitle.trim()
    if (!title) return

    const nextPosition = todos.length ? Math.max(...todos.map((t) => t.position ?? 0)) + 1 : 1
    if (!online) {
      const tempId = `temp_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`
      const created = { id: tempId, title, done: false, user: userId, position: nextPosition }
      todos = [created, ...todos]
      enqueueAction(userId, { type: 'create', tempId, data: created })
      saveCachedTodos(userId, todos)
      newTitle = ''
      offlineNotice = 'Offline: changes will sync when you are back online.'
      return
    }

    const created = await runTask(
      async () => createTodo(userId, title, nextPosition),
      {
        setBusy,
        setError,
        errorMessage: 'Failed to create todo.'
      }
    )

    if (created) {
      todos = [created, ...todos]
      newTitle = ''
      saveCachedTodos(userId, todos)
    }
  }

  const toggleDone = async (todo) => {
    if (!online) {
      const updated = { ...todo, done: !todo.done }
      todos = todos.map((item) => (item.id === todo.id ? updated : item))
      enqueueAction(userId, { type: 'update', id: todo.id, data: { done: updated.done } })
      saveCachedTodos(userId, todos)
      offlineNotice = 'Offline: changes will sync when you are back online.'
      return
    }

    const updated = await runTask(
      async () => updateTodo(todo.id, { done: !todo.done }),
      {
        setBusy,
        setError,
        errorMessage: 'Failed to update todo.'
      }
    )

    if (updated) {
      todos = todos.map((item) => (item.id === todo.id ? updated : item))
      saveCachedTodos(userId, todos)
    }
  }

  const removeTodo = async (todo) => {
    if (!online) {
      todos = todos.filter((item) => item.id !== todo.id)
      enqueueAction(userId, { type: 'delete', id: todo.id })
      saveCachedTodos(userId, todos)
      offlineNotice = 'Offline: changes will sync when you are back online.'
      return
    }

    await runTask(
      async () => deleteTodo(todo.id),
      {
        setBusy,
        setError,
        errorMessage: 'Failed to delete todo.'
      }
    )

    todos = todos.filter((item) => item.id !== todo.id)
    saveCachedTodos(userId, todos)
  }

  const startEdit = (todo) => {
    reorderId = null
    editingId = todo.id
    editingTitle = todo.title
  }

  const cancelEdit = (fromMouseDown = false) => {
    if (fromMouseDown) {
      suppressBlurSave = true
      return
    }
    editingId = null
    editingTitle = ''
  }

  const saveEdit = async () => {
    if (!editingId) return
    const nextTitle = editingTitle.trim()
    if (!nextTitle) return
    if (!online) {
      const updated = todos.find((item) => item.id === editingId)
      if (updated) {
        const next = { ...updated, title: nextTitle }
        todos = todos.map((item) => (item.id === editingId ? next : item))
        enqueueAction(userId, { type: 'update', id: editingId, data: { title: nextTitle } })
        saveCachedTodos(userId, todos)
        cancelEdit()
        offlineNotice = 'Offline: changes will sync when you are back online.'
      }
      return
    }

    const updated = await runTask(
      async () => updateTodo(editingId, { title: nextTitle }),
      {
        setBusy,
        setError,
        errorMessage: 'Failed to update todo.'
      }
    )

    if (updated) {
      todos = todos.map((item) => (item.id === editingId ? updated : item))
      saveCachedTodos(userId, todos)
      cancelEdit()
    }
  }

  const handleEditBlur = () => {
    if (suppressBlurSave) {
      suppressBlurSave = false
      return
    }
    saveEdit()
  }

  const handleDragStart = (todo) => {
    draggingId = todo.id
  }

  const handleDragOver = (todo, event) => {
    if (!draggingId || draggingId === todo.id) return
    const rect = event.currentTarget.getBoundingClientRect()
    const isAfter = event.clientY > rect.top + rect.height / 2
    dragOverId = todo.id
    dragOverPosition = isAfter ? 'after' : 'before'
  }

  const handleDragEnd = () => {
    draggingId = null
    dragOverId = null
    dragOverPosition = null
  }

  const applyReorder = async (reordered) => {
    const updates = reordered.map((item, index) => ({ ...item, position: index + 1 }))
    todos = updates

    if (!online) {
      enqueueAction(userId, { type: 'reorder', items: updates.map(({ id, position }) => ({ id, position })) })
      saveCachedTodos(userId, todos)
      offlineNotice = 'Offline: changes will sync when you are back online.'
      return
    }

    await runTask(
      async () => {
        await Promise.all(
          updates.map((item) => updateTodo(item.id, { position: item.position }))
        )
      },
      {
        setBusy,
        setError,
        errorMessage: 'Failed to reorder todos.'
      }
    )
    saveCachedTodos(userId, todos)
  }

  const handleDrop = async (target) => {
    if (!draggingId || draggingId === target.id) return

    const fromIndex = todos.findIndex((item) => item.id === draggingId)
    const toIndex = todos.findIndex((item) => item.id === target.id)
    if (fromIndex === -1 || toIndex === -1) return

    const reordered = [...todos]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    draggingId = null
    dragOverId = null
    dragOverPosition = null
    await applyReorder(reordered)
  }

  const handleLongPress = (todo) => {
    reorderId = reorderId === todo.id ? null : todo.id
  }

  const moveUp = async (todo) => {
    const fromIndex = todos.findIndex((item) => item.id === todo.id)
    if (fromIndex <= 0) return
    const reordered = [...todos]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(fromIndex - 1, 0, moved)
    await applyReorder(reordered)
  }

  const moveDown = async (todo) => {
    const fromIndex = todos.findIndex((item) => item.id === todo.id)
    if (fromIndex === -1 || fromIndex >= todos.length - 1) return
    const reordered = [...todos]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(fromIndex + 1, 0, moved)
    await applyReorder(reordered)
  }

  $effect(() => {
    if (userId !== currentUserId) {
      currentUserId = userId
      if (userId) {
        if (online) {
          processQueue(userId, { createTodo, updateTodo, deleteTodo, getTodo })
            .then((result) => {
              if (result?.skipped?.length) {
                conflictNotice = `Skipped ${result.skipped.length} change(s) due to newer server updates.`
              }
              return loadTodos()
            })
            .catch(() => loadTodos())
        } else {
          todos = loadCachedTodos(userId)
        }
      } else {
        todos = []
        editingId = null
        editingTitle = ''
      }
    }
  })

  onMount(() => {
    online = isOnline()

    const handleOnline = () => {
      online = true
      offlineNotice = ''
      if (userId) {
        processQueue(userId, { createTodo, updateTodo, deleteTodo, getTodo })
          .then((result) => {
            if (result?.skipped?.length) {
              conflictNotice = `Skipped ${result.skipped.length} change(s) due to newer server updates.`
            }
            return loadTodos()
          })
          .catch(() => loadTodos())
      }
    }

    const handleOffline = () => {
      online = false
      offlineNotice = 'Offline: changes will sync when you are back online.'
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  })

</script>

<form
  class="todo-add-form"
  onsubmit={(event) => {
    event.preventDefault()
    addTodo()
  }}
>
  <div class="todo-add-input-wrap">
    <svg class="todo-add-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
    <input id="newTitle" class="todo-add-input" type="text" bind:value={newTitle} placeholder="New Task" />
  </div>
  <button type="submit" class="icon-button todo-filter-btn" aria-label="Add todo" disabled={busy}>
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  </button>
</form>

{#if loadError}
  <small class="error">{loadError}</small>
{/if}
{#if offlineNotice}
  <small class="muted">{offlineNotice}</small>
{/if}
{#if conflictNotice}
  <small class="muted">{conflictNotice}</small>
{/if}

<div class="todo-list">
  {#if loadingTodos}
    <div class="loader">
      <span class="spinner"></span>
      <small class="muted">Loading todos…</small>
    </div>
  {:else if todos.length === 0}
    <small class="muted">No todos yet.</small>
  {:else}
    {#each todos as todo}
      <TodoItem
        {todo}
        {busy}
        isEditing={editingId === todo.id}
        {editingTitle}
        onToggle={toggleDone}
        onStartEdit={startEdit}
        onSave={saveEdit}
        onCancel={cancelEdit}
        onDelete={removeTodo}
        onTitleChange={(value) => (editingTitle = value)}
        onBlur={handleEditBlur}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        dropPosition={dragOverId === todo.id ? dragOverPosition : null}
        onLongPress={handleLongPress}
        showReorder={reorderId === todo.id}
        onMoveUp={moveUp}
        onMoveDown={moveDown}
      />
    {/each}
  {/if}
</div>

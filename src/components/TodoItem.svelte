<script>
  let {
    todo,
    isEditing = false,
    editingTitle = '',
    busy = false,
    onToggle = () => {},
    onStartEdit = () => {},
    onSave = () => {},
    onCancel = () => {},
    onDelete = () => {},
    onTitleChange = () => {},
    onBlur = () => {},
    onDragStart = () => {},
    onDragOver = () => {},
    onDrop = () => {},
    onDragEnd = () => {},
    dropPosition = null,
    showReorder = false,
    onMoveUp = () => {},
    onMoveDown = () => {},
    onLongPress = () => {}
  } = $props()

  let touchTimer = null

  const handleTouchStart = () => {
    touchTimer = setTimeout(() => {
      onLongPress(todo)
    }, 400)
  }

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      touchTimer = null
    }
  }

  const autofocus = (node) => {
    queueMicrotask(() => node.focus())
    return {}
  }
</script>

<div
  class={`todo-item ${todo.done ? 'done' : ''} ${dropPosition ? `drop-${dropPosition}` : ''}`}
  draggable="true"
  on:dragstart={() => onDragStart(todo)}
  on:dragover={(e) => {
    e.preventDefault()
    onDragOver(todo, e)
  }}
  on:dragend={onDragEnd}
  on:drop={(e) => {
    e.preventDefault()
    onDrop(todo)
  }}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>
  <input type="checkbox" checked={todo.done} on:change={() => onToggle(todo)} />
  {#if isEditing}
    <input
      type="text"
      value={editingTitle}
      use:autofocus
      on:input={(e) => onTitleChange(e.target.value)}
      on:blur={onBlur}
      on:keydown={(e) => {
        if (e.key === 'Enter') onSave()
        if (e.key === 'Escape') onCancel()
      }}
    />
  {:else}
    <div on:dblclick={() => onStartEdit(todo)}>{todo.title}</div>
  {/if}
  {#if isEditing}
    <div class="row">
      <button class="icon-button" on:click={onSave} disabled={busy}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M17 21v-8H7v8" />
          <path d="M7 3v5h8" />
        </svg>
      </button>
      <button class="secondary icon-button" on:mousedown={() => onCancel(true)} on:click={onCancel} disabled={busy}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  {:else}
    <div class="row">
      {#if showReorder}
        <button class="secondary icon-button" on:click={() => onMoveUp(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5l-6 6" />
            <path d="M12 5l6 6" />
          </svg>
        </button>
        <button class="secondary icon-button" on:click={() => onMoveDown(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19l-6-6" />
            <path d="M12 19l6-6" />
          </svg>
        </button>
      {:else}
        <button class="secondary icon-button" on:click={() => onStartEdit(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </button>
        <button class="danger icon-button" on:click={() => onDelete(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
          </svg>
        </button>
      {/if}
    </div>
  {/if}
</div>

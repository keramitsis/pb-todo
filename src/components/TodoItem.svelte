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
  role="listitem"
  draggable="true"
  ondragstart={() => onDragStart(todo)}
  ondragover={(e) => {
    e.preventDefault()
    onDragOver(todo, e)
  }}
  ondragend={onDragEnd}
  ondrop={(e) => {
    e.preventDefault()
    onDrop(todo)
  }}
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  <div class="todo-item-main">
    <input type="checkbox" checked={todo.done} onchange={() => onToggle(todo)} />
    {#if isEditing}
      <input
        type="text"
        value={editingTitle}
        use:autofocus
        oninput={(e) => onTitleChange(e.target.value)}
        onblur={onBlur}
        onkeydown={(e) => {
          if (e.key === 'Enter') onSave()
          if (e.key === 'Escape') onCancel()
        }}
      />
    {:else}
      <button
        type="button"
        class="todo-item-title"
        aria-label={`Edit todo: ${todo.title}`}
        ondblclick={() => onStartEdit(todo)}
      >
        {todo.title}
      </button>
    {/if}
  </div>
  {#if isEditing}
    <div class="row todo-item-actions">
      <button class="icon-button" aria-label="Save todo title" onclick={onSave} disabled={busy}>
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <path d="M17 21v-8H7v8" />
          <path d="M7 3v5h8" />
        </svg>
      </button>
      <button
        class="secondary icon-button"
        aria-label="Cancel editing"
        onmousedown={() => onCancel(true)}
        onclick={onCancel}
        disabled={busy}
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  {:else}
    <div class="row todo-item-actions">
      {#if showReorder}
        <button class="secondary icon-button" aria-label="Move todo up" onclick={() => onMoveUp(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5l-6 6" />
            <path d="M12 5l6 6" />
          </svg>
        </button>
        <button class="secondary icon-button" aria-label="Move todo down" onclick={() => onMoveDown(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19l-6-6" />
            <path d="M12 19l6-6" />
          </svg>
        </button>
      {:else}
        <button class="secondary icon-button" aria-label="Edit todo" onclick={() => onStartEdit(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button class="danger icon-button" aria-label="Delete todo" onclick={() => onDelete(todo)}>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      {/if}
    </div>
  {/if}
</div>

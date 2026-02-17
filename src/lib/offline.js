const cacheKey = (userId) => `todos_cache_${userId}`
const queueKey = (userId) => `todos_queue_${userId}`

export const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine

export const loadCachedTodos = (userId) => {
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const saveCachedTodos = (userId, todos) => {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(todos))
  } catch {
    // ignore
  }
}

const loadQueue = (userId) => {
  try {
    const raw = localStorage.getItem(queueKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveQueue = (userId, queue) => {
  try {
    localStorage.setItem(queueKey(userId), JSON.stringify(queue))
  } catch {
    // ignore
  }
}

export const enqueueAction = (userId, entry) => {
  const stamped = { ts: Date.now(), ...entry }
  const queue = loadQueue(userId)

  if (stamped.type === 'update' && stamped.id?.startsWith('temp_')) {
    const createEntry = queue.find((item) => item.type === 'create' && item.tempId === stamped.id)
    if (createEntry) {
      createEntry.data = { ...createEntry.data, ...stamped.data }
      saveQueue(userId, queue)
      return
    }
  }

  if (stamped.type === 'delete' && stamped.id?.startsWith('temp_')) {
    const next = queue.filter((item) => {
      if (item.type === 'create' && item.tempId === stamped.id) return false
      if (item.type === 'update' && item.id === stamped.id) return false
      return true
    })
    saveQueue(userId, next)
    return
  }

  if (stamped.type === 'reorder') {
    const next = queue.filter((item) => item.type !== 'reorder')
    next.push(stamped)
    saveQueue(userId, next)
    return
  }

  queue.push(stamped)
  saveQueue(userId, queue)
}

export const processQueue = async (userId, { createTodo, updateTodo, deleteTodo, getTodo }) => {
  const queue = loadQueue(userId)
  if (!queue.length) return

  const idMap = {}
  const skipped = []

  for (const entry of queue) {
    if (entry.type === 'create') {
      const data = entry.data ?? {}
      const created = await createTodo(userId, data.title, data.position, data.done)
      idMap[entry.tempId] = created.id
      continue
    }

    if (entry.type === 'update') {
      const id = idMap[entry.id] ?? entry.id
      const current = await getTodo(id).catch(() => null)
      const serverUpdated = current?.updated ? Date.parse(current.updated) : 0
      if (!current || entry.ts >= serverUpdated) {
        await updateTodo(id, entry.data)
      } else {
        skipped.push({ type: entry.type, id })
      }
      continue
    }

    if (entry.type === 'delete') {
      const id = idMap[entry.id] ?? entry.id
      const current = await getTodo(id).catch(() => null)
      const serverUpdated = current?.updated ? Date.parse(current.updated) : 0
      if (!current || entry.ts >= serverUpdated) {
        await deleteTodo(id)
      } else {
        skipped.push({ type: entry.type, id })
      }
      continue
    }

    if (entry.type === 'reorder') {
      const updates = entry.items
        .map((item) => ({
          id: idMap[item.id] ?? item.id,
          position: item.position
        }))
        .filter((item) => !item.id.startsWith('temp_'))

      await Promise.all(
        updates.map(async (item) => {
          const current = await getTodo(item.id).catch(() => null)
          const serverUpdated = current?.updated ? Date.parse(current.updated) : 0
          if (!current || entry.ts >= serverUpdated) {
            await updateTodo(item.id, { position: item.position })
          } else {
            skipped.push({ type: entry.type, id: item.id })
          }
        })
      )
    }
  }

  saveQueue(userId, [])
  return { skipped }
}

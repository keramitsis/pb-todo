import { pb } from './pb.svelte.js'

export const listTodos = async (userId) => {
  return pb.collection('todos').getFullList({
    sort: 'position,-created',
    filter: `user = "${userId}"`
  })
}

export const createTodo = async (userId, title, position = 0, done = false) => {
  return pb.collection('todos').create({
    title,
    done,
    user: userId,
    position
  })
}

export const updateTodo = async (id, data) => {
  return pb.collection('todos').update(id, data)
}

export const deleteTodo = async (id) => {
  return pb.collection('todos').delete(id)
}

export const getTodo = async (id) => {
  return pb.collection('todos').getOne(id)
}

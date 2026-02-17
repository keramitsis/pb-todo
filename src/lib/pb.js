import PocketBase from 'pocketbase'
import { writable } from 'svelte/store'

export const pb = new PocketBase(import.meta.env.VITE_PB_URL)
pb.autoCancellation(false)

const initialAuth = {
  valid: pb.authStore.isValid,
  record: pb.authStore.record
}

export const auth = writable(initialAuth)

pb.authStore.onChange(() => {
  auth.set({
    valid: pb.authStore.isValid,
    record: pb.authStore.record
  })
}, true)

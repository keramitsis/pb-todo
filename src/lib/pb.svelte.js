import PocketBase from 'pocketbase'

export const pb = new PocketBase(import.meta.env.VITE_PB_URL)
pb.autoCancellation(false)

let authState = $state({
  valid: pb.authStore.isValid,
  record: pb.authStore.record
})

pb.authStore.onChange(() => {
  authState.valid = pb.authStore.isValid
  authState.record = pb.authStore.record
}, true)

export const auth = {
  get valid() { return authState.valid },
  get record() { return authState.record }
}

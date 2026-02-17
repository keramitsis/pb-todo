export const runTask = async (task, { setBusy, setError, errorMessage } = {}) => {
  if (setError) setError('')
  if (setBusy) setBusy(true)
  try {
    return await task()
  } catch (err) {
    if (setError) {
      setError(err?.message ?? errorMessage ?? 'Something went wrong.')
    }
    return null
  } finally {
    if (setBusy) setBusy(false)
  }
}

module.exports = function revisionRoot(kv) {
  if (kv === null || kv === undefined) return null
  if (!kv.value || !kv.value.content) throw new Error('cannot get revisionRoot: invalid message')
  return kv.value.content.revisionRoot || kv.key
}

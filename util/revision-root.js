module.exports = function revisionRoot(kv) {
  if (!kv || !kv.value || !kv.value.content) throw new Error('cannot get revisionRoot: invalid message')
  return kv.value.content.revisionRoot || kv.key
}

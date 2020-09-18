module.exports = function(kvm) {
  const {key, value, meta, seq} = kvm
  const {author, content} = value
  if (content.type !== 'work-span') return []
  if (typeof content.project !== 'string' || typeof content.endTime !== 'number') return []
  return [
    [author, content.project, content.endTime]
  ]
}


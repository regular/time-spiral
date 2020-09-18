const indexers = {
  'work-span': indexWorkSpan
}

function  indexWorkSpan(author, content) {
  if (typeof content.project !== 'string' || typeof content.endTime !== 'number') return []
  const {project, endTime} = content
  return [
    ['APE', author, project, endTime],
    ['AE', author, endTime]
  ]
}

module.exports = function(kvm) {
  const {key, value, meta, seq} = kvm
  const {author, content} = value
  if (typeof content === 'string') return []
  const f = indexers[content.type]
  if (!f) return []
  return f(author, content)
}


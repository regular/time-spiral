const indexers = {
  'work-span': indexWorkSpan,
  'project': indexProject
}

function indexProject(author, content) {
  const team = content.team || []
  return team.map(feedId =>
    // PM: project member
    ['PM', feedId]
  ).concat(
    // PN: project name
    ['PN', content.name || '']
  )
}

function indexWorkSpan(author, content) {
  if (typeof content.project !== 'string' || typeof content.endTime !== 'number') return []
  const {project, endTime} = content
  return [
    ['WAPE', author, project, endTime],
    ['WAE', author, endTime]
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


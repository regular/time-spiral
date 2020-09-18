module.exports = function(kvm) {
  const {key, value, meta, seq} = kvm
  const {content} = value

  if (content.type !== 'project') return []
  const team = content.team || []
  return team.map(feedId =>
    ['T', feedId]
  ).concat(
    ['N', content.name || '']
  )
}

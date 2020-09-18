module.exports = function(ssb) {
  return function patch(kv, newContent, cb) {
    const revRoot = kv.value.content.revisionRoot || kv.key
    // TODO: no-op if no change
    ssb.revisions.getLatestRevision(revRoot, (err, kv) =>{
      if (err) return cb(err)
      const {content} = kv.value
      Object.assign(content, newContent)
      content.revisionRoot = revRoot
      content.revisionBranch = kv.key
      ssb.publish(content, cb)
    })
  }
}

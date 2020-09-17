const Obv = require('obv')
const Value = require('mutant/value')
const pull = require('pull-stream')
const defer = require('pull-defer')
const collect = require('collect-mutations')
const debug = require('debug')('tspl:work-spans-source')
const revisionRoot = require('./util/revision-root')

module.exports = function(ssb) {
  const source = Source(ssb)

  return function workSpans(spans, selectedProject, feedId) {
    let drain
    feedId(getSpans)
    selectedProject(getSpans)
    return function abort() {
      if (drain) drain.abort()
      drain = null
    }

    function getSpans() {
      spans.clear()
      if (drain) drain.abort()
      if (!feedId() || !selectedProject()) return
      const o = {live: true, sync: true}
      pull(
        source(feedId(), revisionRoot(selectedProject()), o),
        pull.through( kvv=>debug('source %o', kvv)),
        drain = collect(spans, o)
      )
    }
  }
}

function Source(ssb) {
  const viewHandle = Obv()

  const src = `
    module.exports = function(kvm) {
      const {key, value, meta, seq} = kvm
      const {author, content} = value
      if (content.type !== 'work-span') return []
      if (typeof content.project !== 'string' || typeof content.endTime !== 'number') return []
      return [
        [author, content.project, content.endTime]
      ]
    }
  `

  ssb.sandviews.openView(src, (err, handle) => {
    debug('openView returns: %o %s', err, handle)
    if (err) return viewHandle.set(err)
    viewHandle.set(handle)
  })

  return function(feedId, projectId, opts) {
    opts = opts || {}
    const minTime = opts.minTime || Date.now() / 1000 - 24 * 60 * 60
    const deferred = defer.source()
    viewHandle.once( handle =>{
      debug('viewHandle set to %s', handle)
      if (handle instanceof Error) return deferred.resolve(pull.error(handle))
      if (!handle) return deferred.resolve(pull.error('now sandviews handle'))

      debug('query work-spans for %s %s', feedId, projectId)

      debug('query feddId=%s, projectId=%s, minTime=%d', feedId, projectId, minTime)
      deferred.resolve(
        ssb.sandviews.read(handle, Object.assign({}, opts, {
          gt: [feedId, projectId, minTime],
          lt: [feedId, projectId, Number.MAX_SAFE_INTEGER] // undefined does not work here, it gets lost over muxrpc!
        }))
      )
    })
    return deferred
  }
}


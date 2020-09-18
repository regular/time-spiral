const fs = require('fs')
const debug = require('debug')('tspl:work-spans-source')
const revisionRoot = require('./util/revision-root')
const View = require('./view')

module.exports = function(ssb) {
  const view = View(ssb, fs.readFileSync('./views/work-spans.js', 'utf8'))

  return function workSpans(spans, projectKvObs, feedIdObs, opts) {
    opts = opts || {}
    let abort
    const query = view(spans)
    feedIdObs(getSpans)
    projectKvObs(getSpans)
    return abortQuery

    function abortQuery() {
      if (abort) abort()
      abort = null
    }

    function getSpans() {
      abortQuery()
      spans.clear()
      const feedId = feedIdObs()
      const projectId = revisionRoot(projectKvObs())
      if (!feedId || !projectId) return
      const minTime = opts.minTime || Date.now() / 1000 - 24 * 60 * 60 // default to last 24 hours
      debug('query feddId=%s, projectId=%s, minTime=%d', feedId, projectId, minTime)

      abort = query({
        gt: [feedId, projectId, minTime],
        lt: [feedId, projectId, Number.MAX_SAFE_INTEGER] // undefined does not work here, it gets lost over muxrpc!
      })
    }
  }
}


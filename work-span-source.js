const fs = require('fs')
const debug = require('debug')('tspl:work-spans-source')
const revisionRoot = require('./util/revision-root')
const View = require('./view')

module.exports = function(ssb) {
  const view = View(ssb, fs.readFileSync('./views/work-spans.js', 'utf8'))

  return function workSpans(spans, feedIdObs, projectKvObs, opts) {
    opts = opts || {}
    let abort
    const query = view(spans)
    feedIdObs(getSpans)
    if (projectKvObs) projectKvObs(getSpans)
    return abortQuery

    function abortQuery() {
      if (abort) abort()
      abort = null
    }

    function getSpans() {
      abortQuery()
      spans.clear()
      const feedId = feedIdObs()
      const projectId = projectKvObs && revisionRoot(projectKvObs())
      //if (!feedId || !projectId) return
      if (!feedId) return
      const minTime = opts.minTime || Date.now() / 1000 - 24 * 60 * 60 // default to last 24 hours
      debug('query wrok-spans for feddId=%s, projectId=%s, minTime=%d', feedId, projectId, minTime)

      if (projectId) {
        abort = query({
          gt: ['APE', feedId, projectId, minTime],
           // undefined does not work here, it gets lost over muxrpc!
          lt: ['APE', feedId, projectId, Number.MAX_SAFE_INTEGER]
        })
      } else {
        abort = query({
          gt: ['AE', feedId, minTime],
           // undefined does not work here, it gets lost over muxrpc!
          lt: ['AE', feedId, Number.MAX_SAFE_INTEGER]
        })
      }
    }
  }
}


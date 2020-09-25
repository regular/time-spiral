const Obv = require('obv')
const pull = require('pull-stream')
const defer = require('pull-defer')
const collect = require('collect-mutations')
const debug = require('debug')('tspl:view')

/* Usage:
const View = require('view')
const view = View(ssb, src)
const query = view(mutantArray)
abort = query({gt:, lt:}, ..)
*/

module.exports = function View(ssb, src) {
  const source = Source(ssb, src)

  return function view(result) {
    let drain
    return function query(opts) {
      result.clear()
      if (drain) drain.abort()
      const o = Object.assign({}, opts, {live: true, sync: true})
      pull(
        source(o),
        drain = collect(result, {live: true, sync: true}, onEnd)
      )

      function onEnd(err) {
        debug('view query stream ended err: %s', err && err.message || 'null')
        if (err.message == 'unexpected end of parent stream') {
          debug('resuming')
          setTimeout(()=>query(opts), 0)
        }
      }
      return function abort() {
        if (drain) drain.abort()
        drain = null
      }
    }
  }
}

function Source(ssb, src) {
  const viewHandle = Obv()

  ssb.sandviews.openView(src, (err, handle) => {
    debug('openView returns: %o %s', err, handle)
    if (err) return viewHandle.set(err)
    viewHandle.set(handle)
  })

  return function(opts) {
    opts = opts || {}
    const deferred = defer.source()
    viewHandle.once( handle =>{
      debug('viewHandle set to %s', handle)
      if (handle instanceof Error) return deferred.resolve(pull.error(handle))
      if (!handle) return deferred.resolve(pull.error('now sandviews handle'))

      deferred.resolve(
        ssb.sandviews.read(handle, opts)
      )
    })
    return deferred
  }
}


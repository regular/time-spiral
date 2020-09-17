const h = require('mutant/html-element')
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const pull = require('pull-stream')
const debug = require('debug')('tspl:work-spans')
const WorkSpanSource = require('./work-span-source')
const dayjs = require('dayjs').extend(require('dayjs/plugin/localizedFormat'))
const revisionRoot = require('./util/revision-root')

module.exports = function(ssb) {
  const source = WorkSpanSource(ssb)
  return {renderAddSpanButton, renderSpanList}

  function patch(kv, newContent, cb) {
    const revRoot = kv.value.content.revisionRoot || kv.key
    ssb.revisions.getLatestRevision(revRoot, (err, kv) =>{
      if (err) return cb(err)
      const {content} = kv.value
      Object.assign(content, newContent)
      content.revisionRoot = revRoot
      content.revisionBranch = kv.key
      ssb.publish(content, cb)
    })
  }

  function renderAddSpanButton(projectObs) {
    return h('button.add.span', {
      'ev-click': ev => addSpan(ssb, revisionRoot(projectObs()), (err, kv) => {
        if (err) return console.error(err.message)
        debug('added span %o', kv)
      })
    })
  }

  function renderSpanList(feedId, projectId, opts) {
    opts = opts || {}
    const spans = MutantArray()
    const o = {sync: true, live: true}
    const abort = source(spans, projectId, feedId)

    return h('.work-span-list.list', {
      hooks: [el=>el=>abort()], // abort pull stream when element is removed from dom
    }, MutantMap(spans, kvObs => {
      return computed(kvObs, kv => renderSpan(kv))
    }))

    function renderSpan(kv) {
      debug('render %o', kv)
      if (!kv) return []
      const {content} = kv.value
      const {startTime, endTime} = content
      return [
        h('.time', formatTime(startTime)),
        h('.time', formatTime(endTime))
      ]
    }
  }
}

function formatTime(t) {
  return dayjs(t * 1000).format('ll LT')
}

function addSpan(ssb, project, cb) {
  ssb.whoami( (err, feed) =>{
    if (err) return cb(err)
    const now = Date.now()
    ssb.publish({
      type: 'work-span',
      project,
      startTime: Math.floor(now / 1000 - 4 * 60 * 60),
      endTime: Math.floor(now / 1000)
    }, cb)
  })
}

function compareProjects(kva, kvb) {
  const a = kva.value.content
  const b = kvb.value.content
  debug('compare %o %o', a, b)

  if (a.flagged && !b.flagged) return -1
  if (!a.flagged && b.flagged) return 1
  const aname = a.name.toUpperCase()
  const bname = b.name.toUpperCase()
  // sort empty names at the end
  if (!aname) return 1
  if (!bname) return -1
  if (aname < bname) return -1
  if (aname > bname) return 1
  if (kva.key < kvb.key) return -1
  return 1
}

function Source(ssb) {
  const viewHandle = Obv()

  const src = `
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
  `

  ssb.sandviews.openView(src, (err, handle) => {
    console.log(`openView returns: ${err} ${handle}`)
    if (err) return viewHandle.set(err)
    viewHandle.set(handle)
  })

  return function(feedId, opts) {
    opts = opts || {}
    const deferred = defer.source()
    viewHandle.once( handle =>{
      console.log(`viewHandle set to ${handle}`)
      if (handle instanceof Error) return deferred.resolve(pull.error(handle))
      if (!handle) return deferred.resolve(pull.error('now sandviews handle'))

      debug('query list for %s', feedId)

      deferred.resolve(
        ssb.sandviews.read(handle, Object.assign({}, opts, {
          gt: ['T', feedId],
          lt: ['T', feedId, '~'] // undefined does not work here, it gets lost over muxrpc!
        }))
      )
    })
    return deferred
  }
}

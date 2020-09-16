const h = require('mutant/html-element')
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const computed = require('mutant/computed')
const collect = require('collect-mutations')
const pull = require('pull-stream')
const defer = require('pull-defer')
const Obv = require('obv')
const debug = require('debug')('tspl:projects')
const input = require('./input')

const bricons = require('bricons')
const addFont = require('./add-font')

const font= bricons.font({
  fontName: 'iconfont',
  glyphs: {
    'F': 'ionicons/heart',
    'G': 'ionicons/settings'
  }
})
addFont(font)

module.exports = function(ssb) {
  const source = Source(ssb)
  return {renderAddButton, renderList}

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

  function renderProject(kv) {
    debug('render %o', kv)
    if (!kv) return []
    const {content} = kv.value
    const {name, flagged, symbol} = content
    return [
      h('.symbol', 'A'),
      input(name, {
        prompt: 'enter a name',
        placeholder: 'no name',
        onSave: name => {
          patch(kv, {name}, (err, kv) =>{
            if (err) return console.error(err.message)
            debug('changed name: %o', kv)
          })
        }
      }),
      h(`button.flag${flagged == true ? '.flagged' : ''}`, {
        'ev-click': ev=>{
          patch(kv, {flagged: !flagged}, (err, kv) =>{
            if (err) return console.error(err.message)
            debug('changed flag: %o', kv)
          })
        }
      }, 'F'),
      h('button.settings', {
      }, 'G')

    ]
  }

  function renderAddButton() {
    return h('button.add', {
      'ev-click': ev => addProject(ssb, (err, kv) => {
        if (err) return console.error(err.message)
        console.log('added project %o', kv)
      })
    })
  }

  function renderList(feedId) {
    const projects = MutantArray()
    const o = {sync: true, live: true}
    let drain
    pull(
      source(feedId, o),
      pull.through( kvv=>debug('source %o', kvv)),
      drain = collect(projects, o, err =>{
        console.error(err.message)
      })
    )

    const sortedProjects = computed(projects, projects =>{
      return projects.sort(compareProjects)
    })

    return h('.project-list', {
      hooks: [el=>el=>drain.abort()], // abort pull stream when element is removed from dom
    }, MutantMap(sortedProjects, kvObs => {
      return computed(kvObs, kv => renderProject(kv))
    }))
  }
}

function addProject(ssb, cb) {
  ssb.whoami( (err, feed) =>{
    if (err) return cb(err)
    ssb.publish({
      type: 'project',
      name: '',
      symbol: null,
      flagged: false,
      team: [feed.id]
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

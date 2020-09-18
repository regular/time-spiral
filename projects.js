const fs = require('fs')
const h = require('mutant/html-element')
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const debug = require('debug')('tspl:projects')
const input = require('./input')
const revisionRoot = require('./util/revision-root')
const View = require('./view')

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
  const view = View(ssb, fs.readFileSync('./views/projects.js', 'utf8'))
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

  function renderAddButton() {
    return h('button.add.project', {
      'ev-click': ev => addProject(ssb, (err, kv) => {
        if (err) return console.error(err.message)
        console.log('added project %o', kv)
      })
    })
  }

  function renderList(feedId, opts) {
    opts = opts || {}
    const selectedProject = opts.selectedProject || Value()
    const projects = MutantArray()
    const query = view(projects)
    
    debug('query list for %s', feedId)
    const abort = query({
      gt: ['T', feedId],
      lt: ['T', feedId, '~'] // undefined does not work here, it gets lost over muxrpc!
    })

    const sortedProjects = computed(projects, projects =>{
      return projects.sort(compareProjects)
    })

    return h('.project-list.list', {
      hooks: [el=>abort], // abort pull stream when element is removed from dom
    }, MutantMap(sortedProjects, kvObs => {
      return computed(kvObs, kv => renderProject(kv))
    }))

    function renderProject(kv) {
      debug('render %o', kv)
      if (!kv) return []
      const {content} = kv.value
      const {name, flagged, symbol} = content
      return [
        h('.symbol', 'A'),
        input(name, {
          classList: computed(selectedProject, sel =>{
            if (!sel) return []
            if (revisionRoot(sel) == revisionRoot(kv)) return ['selected']
            return []
          }),
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
          'ev-click': ev=>{
            selectedProject.set(kv)
          }
        }, 'G')

      ]
    }
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

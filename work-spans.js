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
const Patch = require('./util/patch')

module.exports = function(ssb) {
  const query = WorkSpanSource(ssb)
  const patch = Patch(ssb)
  return {renderAddButton, renderList, query}

  function renderAddButton(projectObs) {
    return h('button.add.span', {
      'ev-click': ev => addSpan(ssb, revisionRoot(projectObs()), (err, kv) => {
        if (err) return console.error(err.message)
        debug('added span %o', kv)
      })
    })
  }

  function renderList(spans, projects, opts) {
    opts = opts || {}

    return h('.work-span-list.list', [
      MutantMap(spans, kvObs => {
        return computed(kvObs, kv => renderSpan(kv))
      })
    ])

    function renderSpan(kv) {
      return computed(projects, projects => {
        debug('render %o', kv)
        if (!kv) return []
        const {content} = kv.value
        const {project, startTime, endTime} = content

        const projectKv = projects.find(kv=>revisionRoot(kv) == project)
        if (!projectKv) {
          console.warn('No project message found for %s in %o', project, projects)
        }

        return [
          h('.time', formatTime(startTime)),
          h('.time', formatTime(endTime)),
          h('.project', projectKv && projectKv.value.content.name)
        ]
      })
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


const s = require('mutant/svg-element')
const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const spiral = require('./spiral')
const styles = require('module-styles')('time-spiral')
const debug = require('debug')('tspl:graph')
const revisionRoot = require('./util/revision-root')

const t = Value(0)

function setTime() {
  //t.set(t()+1)
  const d = new Date()
  t.set( d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60 + d.getMilliseconds() / 60 / 1000)
}
setInterval(setTime, 1000/15)
//setInterval(setTime, 100)
setTime()

module.exports = function(spans, projects, opts) {
  opts = opts || {}
  const selectedSpan = opts.selectedSpan || Value()
  return h('.time-spiral', [
    clock(),
    s('svg', {
      width: 400,
      height: 400,
      viewBox: "-400 -400 800 800"
    }, [
      s('g', {
        
      }, [
        s('circle.face', {
          cx: 0,
          cy: 0,
          r: 350,
          fill: '#444'
        }),
        computed(t, t=>{  
          return spiralSegment(0 - t, 10 * 60 - t, {
            color: '#333',
            strokeWidth: 1,
          })
        }),
        MutantMap(spans, renderSpan),
        s('line.minute-hand', {
          x1: 0, 
          y1: 50,
          x2: 0,
          y2: -310,
          'stroke-width': 10,
          stroke: 'rgba(0,0,0,0.5)',
          transform: computed(t, t=> `rotate(${t * 6})`)
        }),
        s('line.hour-hand', {
          x1: 0, 
          y1: 0,
          x2: 0,
          y2: -200,
          'stroke-width': 20,
          stroke: 'rgba(0,0,0,0.5)',
          transform: computed(t, t=> `rotate(${t * 6 / 12})`)
        }),
        s('circle', {
          cx: 0,
          cy: 0,
          r: 18,
          fill: 'black'
        })
      ])
    ])
  ])
  function renderSpan(spanObs) {
    return computed([spanObs], kv =>{
      if (!kv) return []
      const {value} = kv
      const {content} = value
      const {startTime, endTime, project} = content
      
      const currMinute = Date.now() / 1000 / 60
      const endMinutesAgo = currMinute - (endTime / 60)
      const startMinutesAgo = currMinute - (startTime / 60)
      debug('render %d min ago to %d min ago', startMinutesAgo, endMinutesAgo)
      return spiralSegment(endMinutesAgo - t(), startMinutesAgo - t(), {
        kv
      })
    })
  }

  function spiralSegment(startT, endT, opts) {
    opts = opts || {}
    const kv = opts.kv
    const strokeWidth = opts.strokeWidth || 20
    const color = opts.color || '#aaa'
    return s('g.spiral-segment', {
      classList: computed(selectedSpan, sel => {
        if (!kv || !sel) return []
        if (revisionRoot(sel) == revisionRoot(kv)) return ['selected']
        return []
      }),
      transform: computed(t, t=> `scale(-1 1) rotate(-${t * 6})`)
    }, [
      s('path', {
        d: computed(t, t => spiral({
          startRadius: 300,
          spacePerLoop: -30,
          startTheta:rad(-90 + (startT + t) * 6),
          endTheta: rad(-90 + (endT + t) * 6),
          thetaStep: rad(30)
        })),
        fill: 'none',
        stroke: color,
        'ev-click': ev=>{
          if (!kv) return
          selectedSpan.set(kv)
        },
        'stroke-width': strokeWidth,
        //'stroke-linecap': 'round'
      })
    ])
    return ret
  }
}


function clock() {
  return h('.clock', computed(t, t=>{
    const m = Math.floor(t%60)
    return `${Math.floor(t/60)}:${m < 10 ? '0' + m : m}`
  }))
}



function rad(x) {
  return x * Math.PI / 180
}

styles(`
.clock {
  font-family: monospace;
  font-size: 56pt;
  color: #aaa;
}
`)

const s = require('mutant/svg-element')
const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const spiral = require('./spiral')
const styles = require('module-styles')('time-spiral')
const debug = require('debug')('tspl:graph')

const t = Value(0)

function setTime() {
  //t.set(t()+1)
  const d = new Date()
  t.set( d.getHours() * 60 + d.getMinutes())
}
setInterval(setTime, 60000)
//setInterval(setTime, 100)
setTime()

module.exports = function(spans) {
  return h('.time-spiral', [
    clock(),
    s('svg', {
      width: 400,
      height: 400,
      viewBox: "-400 -400 800 800"
    }, [
      s('g', {
        
      }, [
        MutantMap(spans, renderSpan),
        s('line.minute-hand', {
          x1: 0, 
          y1: 0,
          x2: 0,
          y2: -400,
          'stroke-width': 10,
          stroke: 'black',
          transform: computed(t, t=> `rotate(${t * 6})`)
        })
      ])
    ])
  ])
}

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
   return spiralSegment(endMinutesAgo - t(), startMinutesAgo - t())
   //return spiralSegment(0-t(), 30-t()) // from now to 30 min in the past
  })
}

function clock() {
  return h('.clock', computed(t, t=>{
    return `${Math.floor(t/60)}:${t%60}`
  }))
}

function spiralSegment(startT, endT) {
  return s('g.spiral-segment', {
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
      stroke: '#aaa',
      'stroke-width': 20,
      'stroke-linecap': 'round'
    })
  ])
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

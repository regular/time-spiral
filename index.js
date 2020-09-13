const s = require('mutant/svg-element')
const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const MutantArray = require('mutant/array')
const MutantMap = require('mutant/map')
const spiral = require('./spiral')
const styles = require('module-styles')('time-spiral')

const t = Value(0)

setInterval(()=>{
  t.set(t()+1)
}, 100)

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

document.body.appendChild(
  h('.time-spiral', [
    clock(),
    s('svg', {
      width: 400,
      height: 400,
      viewBox: "-400 -400 800 800"
    }, [
      s('g', {
        
      }, [
        spiralSegment(0, 60),
        spiralSegment(120, 120 + 45),
        //spiralSegment(40, 55),
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
)

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

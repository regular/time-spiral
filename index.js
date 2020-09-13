const s = require('mutant/svg-element')
const h = require('mutant/html-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const spiral = require('./spiral')
const styles = require('module-styles')('time-spiral')

const t = Value(0)

setInterval(()=>{
  t.set(t()+1)
}, 1000)

document.body.appendChild(
  h('.time-spiral', [
    h('.clock', computed(t, t=>{
      return `${Math.floor(t/60)}:${t%60}`
    })),
    s('svg', {
      width: 400,
      height: 400,
      viewBox: "-400 -400 800 800"
    }, [
      s('g', {
        
      }, [
        s('g.spiral', {
          transform: computed(t, t=> `scale(-1 1) rotate(-${t * 6})`)
        }, [
          s('path', {
            d: spiral({
              x:0,
              y:0,
              startRadius: 300,
              spacePerLoop: -30,
              startTheta:rad(-90),
              endTheta: rad(10*360),
              thetaStep: rad(30)
            }),
            fill: 'none',
            stroke: '#aaa',
            'stroke-width': 20,
            'stroke-linecap': 'round'
          })
        ]),
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

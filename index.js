const s = require('mutant/svg-element')
const computed = require('mutant/computed')
const Value = require('mutant/value')
const spiral = require('./spiral')

const t = Value(90)

setInterval(()=>{
  t.set(t()+1)
}, 10)

document.body.appendChild(
  s('svg', {
    width: 400,
    height: 400,
    viewBox: "0 0 800 800"
  }, [
    s('g', {
      transform: computed(t, t=> `translate(400,400) scale(-1 1) rotate(-${t})`)
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
    ])
  ])
)

function rad(x) {
  return x * Math.PI / 180
}

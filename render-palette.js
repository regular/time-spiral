const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')
const styles = require('module-styles')('tspl-palette')

module.exports = function(palette, opts) {
  opts = opts || {}
  const selectedColor = opts.selectedColor || Value()
  return h('.palette', {
  }, Object.entries(palette).map( ([name, color], i) =>{
    return h('.color', {
      classList: computed(selectedColor, sel =>{
        if (sel && sel.name == name) return ['selected']
        return []
      }),
      'ev-click': ev=>{
        selectedColor.set({name, color})
      },
      title: name,
      style: {
        'grid-column': `${i+1}/${i+2}`,
        background: `#${color}`
      }
    },[h('.marker')])
  }).concat(h('.border',{
    style: {
      'grid-column': `1 / ${Object.keys(palette).length + 1}`
    }
  }))) 
}

styles(`
.palette {
  display: grid;
  place-self: start;
  grid-template-rows: 45px;
  grid-auto-columns: 60px;
  grid-auto-flow: column;
  overflow: hidden;
}
.palette, .palette>.border {
  border-radius: 10px;
}
.palette>.border {
  grid-row: 1 / 2;
  background: transparent;
  border: 3px solid rgba(0,0,0,0.6);
  pointer-events: none;
}
.palette>.color {
  grid-row: 1/2;
  place-self: stretch;
}
.palette>.color>.marker {
  visibility: hidden;
}
.palette>.color.selected>.marker {
  visibility: visible;
  background: white;
  margin: 20%;
  border: 10px solid white;
  box-sizing: border-box;
  border-radius: 10px;
  opacity: 0.4;
}
`)


const h = require('mutant/html-element')
const computed = require('mutant/computed')

module.exports = function(str, opts) {
  opts = opts || {}
  const {readOnly} = opts
  return h('input.string', {
    classList: opts.classList || [],
    attributes: {
      readonly: computed(readOnly, readOnly => readOnly ? true : undefined),
      type: 'text',
      value: str,
      minlength: 1,
      //size: opts.size,
      spellcheck: false,
      placeholder: computed(readOnly, readOnly =>
        readOnly ? (opts.placeholder || 'n/a') : (opts.prompt || 'enter a string')
      )
    },
    'ev-keyup': e=>{
      if (e.key == 'Enter') e.target.blur()
    },
    'ev-blur': e=>{
      if (str.set) str.set(e.target.value)
      if (opts.onSave) opts.onSave(e.target.value)
    }
  })
}

const crypto = require('crypto')
const Styles = require('module-styles')

module.exports = function addFont({data, fontName, type, weight, style}) {
  data = Buffer.from(data, 'base64')
  const id = '_' + crypto.createHash('sha256').update(data).digest('base64')
  if (document.getElementById(id)) return

  const blob = new Blob([data], {type})
  const fontURL = URL.createObjectURL(blob)
  const format = type == 'font/ttf' ? 'truetype' : null
  if (!format) throw new Error(`Unsupported font type ${type}`)
  const setStyle = Styles(`font-${id.slice(1)}`)
  setStyle(`
    @font-face {
      font-family: "${fontName}";
      src: url(${fontURL}) format("${format}");
      font-weight: ${weight || 'normal'};
      font-style: ${style || 'normal'};
    }
  `)
}

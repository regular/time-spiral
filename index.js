const fs = require('fs')
const {client} = require('tre-client')
const Projects = require('./projects')
const h = require('mutant/html-element')
const Value = require('mutant/value')
const MutantArray = require('mutant/array')
const computed = require('mutant/computed')
const styles = require('module-styles')('tspl-main')

const renderGraph = require('./graph')
const renderPalette = require('./render-palette')
const WorkSpanSource = require('./work-span-source')
const WorkSpans = require('./work-spans')

client((err, ssb, config) =>{
  const workSpanSource = WorkSpanSource(ssb)

  const feedId = Value()
  const selectedProject = Value()
  const currentSpans = MutantArray()

  ssb.whoami(ssb, (err, feed) =>{
    if (err) console.log(err)
    feedId.set(feed.id)
  })

  const abort = workSpanSource(currentSpans, selectedProject, feedId)

  const {renderList, renderAddButton} = Projects(ssb)
  const {renderSpanList, renderAddSpanButton} = WorkSpans(ssb)

  document.body.appendChild(h('.tspl-main', {
    hooks: [el=>abort]
  }, [
    h('.hspl-sidebar', [
      computed(feedId, feedId => feedId ? renderList(feedId, {selectedProject}) : h('.spinner', 'spinner')),
      renderAddButton(),
    ]),
    renderGraph(currentSpans),
    h('.hspl-rightbar', [
      renderSpanList(feedId, selectedProject),
      renderAddSpanButton(selectedProject)
    ])
    //renderPalette(JSON.parse(fs.readFileSync('palettes/f94144-f3722c-f8961e-f9c74f-90be6d-43aa8b-577590.json')))
  ]))
})

styles(`
html, html * {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}
body {
  color: #999;
  font-family: sans-serif;
  -webkit-text-stroke-color: #666;
}

input {
  background: transparent;
  border: none;
  color: inherit;
  font-size: inherit;
}
input.selected {
  color: white;
  background: #111;
}

button {
  background: transparent;
  border: none;
  color: inherit;
  font-size: inherit;
  padding: .2em;
  border-radius: .1em;
}

button:hover {
  color: #333;
  -webkit-text-stroke-color: #222;
  background: #aaa;
}
.tspl-main {
  display: grid;
  grid-template-columns: 400px 1fr 400px;
}
.tspl-main button.add {
  height: 1em;
}
.tspl-main button.add.project:before {
  content: "add project";
}
.tspl-main button.add.span:before {
  content: "add work span";
}

.tspl-main .list {
  border-bottom: 1px solid #888;
  margin-bottom: 1px;
}

.tspl-main .project-list {
  font-size: 28pt;
  display: grid;
  grid-template-columns: 1.4em minmax(2em, 1fr) 1.4em 1.4em;
}

.tspl-main .work-span-list {
  display: grid;
  column-gap: 1em;
  grid-template-columns: 1fr 1fr;
}

.tspl-main .project-list button.flag,
.tspl-main .project-list button.settings {
  font-family: "iconfont";
}
.tspl-main .project-list button.flag:not(.flagged) {
  -webkit-text-stroke-width: 1.2px;
  color: transparent;
}
`)

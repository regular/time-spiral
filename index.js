const fs = require('fs')
const {client} = require('tre-client')
const h = require('mutant/html-element')
const Value = require('mutant/value')
const MutantArray = require('mutant/array')
const computed = require('mutant/computed')
const styles = require('module-styles')('tspl-main')

const Query = require('./query')
const Projects = require('./projects')
const WorkSpans = require('./work-spans')
const renderGraph = require('./graph')
const renderPalette = require('./render-palette')

client((err, ssb, config) =>{
  const {queryProjects, queryWorkSpans} = Query(ssb)
  const projects = Projects(ssb)
  const workSpans = WorkSpans(ssb)
  
  const feedId = Value()
  const selectedProject = Value()
  const currentSpans = MutantArray()
  const currentProjects = MutantArray()
  
  const abort1 = queryWorkSpans(currentSpans, feedId, null, {
    minTime: Date.now()/1000 - 10 * 60 * 60 // 10hours
  })
  const abort2 = queryProjects(currentProjects, feedId)

  function abort() {
    abort1()
    abort2()
  }

  ssb.whoami(ssb, (err, feed) =>{
    if (err) console.log(err)
    if (!feed.id) return
    feedId.set(feed.id)
  })

  document.body.appendChild(h('.tspl-main', {
    hooks: [el=>abort]
  }, [
    h('.hspl-sidebar', [
      projects.renderList(currentProjects, {selectedProject}),
      projects.renderAddButton()
    ]),
    renderGraph(currentSpans, currentProjects),
    h('.hspl-rightbar', [
      workSpans.renderList(currentSpans, currentProjects),
      workSpans.renderAddButton(selectedProject)
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
  grid-template-columns: 1fr 1fr auto;
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

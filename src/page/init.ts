import { fromEvent } from 'rxjs'
import { repository } from '../../package.json'
import { githubCornerHTML } from '../lib/githubCorner'
import { Pair } from '../type/pair'
import { WebcellConfig } from '../type/webcellConfig'
import { createNoisyStateWithObservable } from '../util/noisyState'
import { randomSeed } from '../util/randomSeed'
import { getUrlParam } from '../util/urlParam'
import { h } from '../lib/hyper'

interface InitProp {
   document: Document
   location: Location
   window: Window
}

let getConfig = (prop: InitProp) => {
   let { location } = prop

   let config = getUrlParam<WebcellConfig>(location, {
      width: () => 1979,
      seed: () => randomSeed(),
   })

   console.info(`#seed=${config.seed}`)

   return config
}

export let init = (prop: InitProp) => {
   let { document, window } = prop
   let config = getConfig(prop)

   let canvas = h('canvas')

   let corner = h('i', {
      innerHTML: githubCornerHTML(repository),
   })

   document.body.append(
      h('h1', {
         textContent: document.title,
         className: 'inline',
      }),
      h('div', {}, [canvas]),
      corner,
   )

   let screenSize = createNoisyStateWithObservable(fromEvent(window, 'resize'))(
      (): Pair => ({
         y: window.innerHeight,
         x: window.innerWidth,
      }),
   )

   return {
      canvas,
      config,
      screenSize,
   }
}

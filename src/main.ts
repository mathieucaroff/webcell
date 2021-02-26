import { PicoGL } from 'picogl'
import { animationFrameScheduler } from 'rxjs'
import { default as seedrandom } from 'seedrandom'
import { init } from './page/init'
import { getContextWebGl2 } from './util/getContext'
import { spacelessURL } from './util/urlParam'

let glsl = (content: TemplateStringsArray) => content.join('')

export let main = async () => {
   spacelessURL(location)

   let { canvas, config, screenSize } = init({ document, location, window })

   let random = seedrandom(config.seed)

   let { gl } = getContextWebGl2(canvas)

   let line = Array.from({ length: canvas.width }, () => (2 * random()) & 1)

   // PROGRAM
   let vertexShaderSource = glsl`
      #version 300 es

      layout(location=0) in vec4 position;
      layout(location=1) in vec3 color;

      out vec3 vColor;
      void main() {
         vColor = color;
         gl_Position = position;
      }
   `

   let fragmentShaderSource = glsl`
      #version 300 es
      precision highp float;

      in vec3 vColor;

      out vec4 fragColor;
      void main() {
         fragColor = vec4(vColor, 1.0);
      }
   `

   let app = PicoGL.createApp(canvas).clearColor(0.0, 0.0, 0.0, 1.0)

   screenSize.attach(({ y, x }) => {
      app.resize(x - 0.5, y - 0.5)
   })

   let [a, b, c, d]: [number, number][] = [
      // [y, x]
      [-0.9, -0.9], // bottom left corner
      [0.9, -0.9], // bottom right corner
      [-0.9, 0.9], // top left corner
      [0.9, 0.9], // top right corner
   ]

   let color = {
      black: [0, 0, 0],
      red: [255, 0, 0],
      green: [0, 255, 0],
      blue: [0, 0, 255],
      cyan: [0, 255, 255],
      magenta: [255, 0, 255],
      yellow: [255, 255, 0],
      white: [255, 255, 255],
   }

   // GEOMETRY IN VERTEX BUFFERS
   let positions = app.createVertexBuffer(
      PicoGL.FLOAT,
      2,
      new Float32Array([
         ...a,
         ...b,
         ...c, //
         ...d, //
         ...b,
         ...c,
      ]),
   )

   let colors = app.createVertexBuffer(
      PicoGL.UNSIGNED_BYTE,
      3,
      new Uint8Array([
         ...color.red,
         ...color.green,
         ...color.blue, //
         ...color.cyan, //
         ...color.magenta,
         ...color.yellow,
      ]),
   )

   // COMBINE VERTEX BUFFERS INTO VERTEX ARRAY
   let triangleArray = app
      .createVertexArray()
      .vertexAttributeBuffer(0, positions)
      .vertexAttributeBuffer(1, colors, { normalized: 1 })

   let [program] = await app.createPrograms([vertexShaderSource, fragmentShaderSource])

   // CREATE DRAW CALL FROM PROGRAM AND VERTEX ARRAY
   let drawCall = app.createDrawCall(program, triangleArray)

   // DRAW
   let draw = () => {
      app.clear()
      drawCall.draw()
   }

   screenSize.attach(draw)

   console.log({ glcheck_renderDone: true })

   let cleanup = () => {
      // Note: cleanup only when deleting the canvas

      // WebGl
      program.delete()
      positions.delete()
      colors.delete()
      triangleArray.delete()
   }

   // animationFrameScheduler.schedule(() => {})
}

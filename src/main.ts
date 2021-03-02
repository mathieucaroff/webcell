import { default as Regl } from 'regl'
import { seedrandom } from './lib/seedrandom'
import { init } from './page/init'
import { getContextWebGl2 } from './util/getContext'
import { spacelessURL } from './util/urlParam'

let glsl = (content: TemplateStringsArray, ...args: unknown[]) => {
   let partList = [content[0]]
   content.slice(1).forEach((v, k) => partList.push('' + args[k], v))
   return partList.join('')
}

export let main = async () => {
   spacelessURL(location)

   let { canvas, config, screenSize } = init({ document, location, window })

   let random = seedrandom(config.seed)

   screenSize.attach(({ y, x }) => {
      canvas.width = x - 0.5
      canvas.height = y - 0.5
   })

   let { gl } = getContextWebGl2(canvas)

   let texture_side = 1
   while (texture_side < config.width) {
      texture_side *= 2
   }
   let initial_conditions = Array(texture_side * texture_side * 4)
      .fill(0)
      .map(() => (random() > 0.95 ? 255 : 0))

   let regl = Regl(gl)

   let state = Array(2)
      .fill(0)
      .map(() =>
         regl.framebuffer({
            color: regl.texture({
               radius: texture_side,
               data: initial_conditions,
               wrap: 'repeat',
            }),
            depthStencil: false,
         }),
      )

   let updateLife = regl({
      frag: glsl`
         precision mediump float;
         uniform sampler2D prevState;
         varying vec2 uv;
         void main() {
            float n = 0.0;
            for(int dx=-1; dx<=1; ++dx) {
               for(int dy=-1; dy<=1; ++dy) {
                  n += texture2D(prevState, uv+vec2(dx,dy)/float(${texture_side})).r;
               }
            }
            float s = texture2D(prevState, uv).r;
            if(n > 3.0+s || n < 3.0) {
               gl_FragColor = vec4(0,0,0,1);
            } else {
               gl_FragColor = vec4(1,1,1,1);
            }
         }`,

      framebuffer: ({ tick }) => state[(tick + 1) % 2],
   })

   let setupQuad = regl({
      frag: glsl`
         precision mediump float;
         uniform sampler2D prevState;
         varying vec2 uv;
         void main() {
            float state = texture2D(prevState, uv).r;
            gl_FragColor = vec4(vec3(state), 1);
         }`,

      vert: glsl`
         precision mediump float;
         attribute vec2 position;
         varying vec2 uv;
         void main() {
            uv = 0.5 * (position + 1.0);
            gl_Position = vec4(position, 0, 1);
         }`,

      attributes: {
         position: [-4, -4, 4, -4, 0, 4],
      },

      uniforms: {
         prevState: ({ tick }) => state[tick % 2],
      },

      depth: { enable: false },

      count: 3,
   })

   regl.frame(() => {
      setupQuad(() => {
         regl.draw()
         updateLife()
      })
   })
}

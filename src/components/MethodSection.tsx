import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useRef } from 'react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const methodText = '照片不是直接缩小，而是先压到实际豆板尺寸，再用感知色差寻找最接近的实体豆色。'

export function MethodSection() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const words = gsap.utils.toArray<HTMLElement>('.method-reveal span')
    gsap.fromTo(words, { opacity: 0.14 }, {
      opacity: 1,
      stagger: 0.035,
      ease: 'none',
      scrollTrigger: {
        trigger: '.method-reveal',
        start: 'top 82%',
        end: 'bottom 48%',
        scrub: 0.7,
      },
    })
    const media = gsap.matchMedia()
    media.add('(min-width: 900px)', () => {
      ScrollTrigger.create({
        trigger: '.method-layout',
        start: 'top 18%',
        end: 'bottom 72%',
        pin: '.method-title',
        pinSpacing: false,
      })
    })
    return () => media.revert()
  }, { scope })

  return (
    <section className="method-section" id="method" ref={scope}>
      <p className="method-reveal" aria-label={methodText}>
        {Array.from(methodText).map((character, index) => <span aria-hidden="true" key={`${character}-${index}`}>{character}</span>)}
      </p>
      <div className="method-layout">
        <div className="method-title">
          <h2>一张能真正照着拼的图纸，需要什么？</h2>
        </div>
        <div className="method-chapters">
          <article>
            <h3>有限色盘，而不是屏幕上的无限颜色</h3>
            <p>先在 Hama Midi 色盘中筛出最常用的颜色，再用 CIEDE2000 感知色差逐格匹配。色号可直接用于备料，屏幕颜色仅作参考。</p>
          </article>
          <article>
            <h3>细节、颜色和工作量要一起平衡</h3>
            <p>格数越高，轮廓越清晰，但豆子总量与拼制时间也会同步增加。抖动适合渐变与照片，图标或像素画通常更适合关闭。</p>
          </article>
          <article>
            <h3>图纸必须在桌面上看得懂</h3>
            <p>PDF 以 5 格粗线、行列编号、格内符号和逐色数量组织；大型作品会自动切成多张 A4，方便分区拼制与核对。</p>
          </article>
        </div>
      </div>
      <div className="source-note">
        <span>方法依据</span>
        <a href="https://www.cie.co.at/publications/colorimetry-part-6-ciede2000-colour-difference-formula-1" target="_blank" rel="noreferrer">CIEDE2000</a>
        <a href="https://hama.dk/en/pages/colour-chart" target="_blank" rel="noreferrer">Hama 官方色卡</a>
        <a href="https://perler.com/blogs/projects/standard-fusing-method" target="_blank" rel="noreferrer">Perler 熨烫说明</a>
      </div>
    </section>
  )
}

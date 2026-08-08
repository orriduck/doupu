export interface Lab {
  l: number
  a: number
  b: number
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

export function rgbToLab(r: number, g: number, b: number): Lab {
  const linearize = (channel: number) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }

  const lr = linearize(r)
  const lg = linearize(g)
  const lb = linearize(b)
  const x = (lr * 0.4124564 + lg * 0.3575761 + lb * 0.1804375) / 0.95047
  const y = (lr * 0.2126729 + lg * 0.7151522 + lb * 0.072175) / 1
  const z = (lr * 0.0193339 + lg * 0.119192 + lb * 0.9503041) / 1.08883
  const pivot = (value: number) => value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116
  const fx = pivot(x)
  const fy = pivot(y)
  const fz = pivot(z)

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

// ISO/CIE 11664-6 CIEDE2000 with the standard graphic-arts weighting factors.
export function deltaE2000(first: Lab, second: Lab): number {
  const degrees = (radians: number) => radians * (180 / Math.PI)
  const radians = (value: number) => value * (Math.PI / 180)
  const c1 = Math.hypot(first.a, first.b)
  const c2 = Math.hypot(second.a, second.b)
  const averageC = (c1 + c2) / 2
  const g = 0.5 * (1 - Math.sqrt(averageC ** 7 / (averageC ** 7 + 25 ** 7)))
  const a1Prime = (1 + g) * first.a
  const a2Prime = (1 + g) * second.a
  const c1Prime = Math.hypot(a1Prime, first.b)
  const c2Prime = Math.hypot(a2Prime, second.b)
  const hue = (a: number, b: number) => {
    const angle = degrees(Math.atan2(b, a))
    return angle >= 0 ? angle : angle + 360
  }
  const h1Prime = hue(a1Prime, first.b)
  const h2Prime = hue(a2Prime, second.b)
  const deltaLPrime = second.l - first.l
  const deltaCPrime = c2Prime - c1Prime
  const hueDifference = h2Prime - h1Prime
  const deltaHPrimeAngle = c1Prime * c2Prime === 0
    ? 0
    : Math.abs(hueDifference) <= 180
      ? hueDifference
      : hueDifference > 180 ? hueDifference - 360 : hueDifference + 360
  const deltaHPrime = 2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(radians(deltaHPrimeAngle / 2))
  const averageL = (first.l + second.l) / 2
  const averageCPrime = (c1Prime + c2Prime) / 2
  const averageHue = c1Prime * c2Prime === 0
    ? h1Prime + h2Prime
    : Math.abs(hueDifference) <= 180
      ? (h1Prime + h2Prime) / 2
      : h1Prime + h2Prime < 360 ? (h1Prime + h2Prime + 360) / 2 : (h1Prime + h2Prime - 360) / 2
  const t = 1
    - 0.17 * Math.cos(radians(averageHue - 30))
    + 0.24 * Math.cos(radians(2 * averageHue))
    + 0.32 * Math.cos(radians(3 * averageHue + 6))
    - 0.2 * Math.cos(radians(4 * averageHue - 63))
  const deltaTheta = 30 * Math.exp(-(((averageHue - 275) / 25) ** 2))
  const rc = 2 * Math.sqrt(averageCPrime ** 7 / (averageCPrime ** 7 + 25 ** 7))
  const sl = 1 + 0.015 * (averageL - 50) ** 2 / Math.sqrt(20 + (averageL - 50) ** 2)
  const sc = 1 + 0.045 * averageCPrime
  const sh = 1 + 0.015 * averageCPrime * t
  const rt = -Math.sin(radians(2 * deltaTheta)) * rc
  const lTerm = deltaLPrime / sl
  const cTerm = deltaCPrime / sc
  const hTerm = deltaHPrime / sh
  return Math.sqrt(lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + rt * cTerm * hTerm)
}

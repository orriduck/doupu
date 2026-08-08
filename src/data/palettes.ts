import type { PaletteId } from '../types'
import { HAMA_MIDI_PALETTE } from './hamaPalette'
import { STUDIO_PALETTE } from './palette'

export const PALETTE_OPTIONS: Array<{ id: PaletteId; label: string }> = [
  { id: 'mard-221', label: 'MARD 221' },
  { id: 'hama-midi', label: 'Hama Midi' },
]

export function getPalette(id: PaletteId) {
  return id === 'hama-midi' ? HAMA_MIDI_PALETTE : STUDIO_PALETTE
}

export type PaletteSection = 'adhkar' | 'prayer'
export type PaletteId = 'A' | 'B' | 'C'
export type PaletteMode = 'light' | 'dark'

export interface PaletteTokens {
  paper: string
  card: string
  ink: string
  muted: string
  border: string
  strong: string
  primary: string
  soft: string
  accent: string
  onPrimary: string
}

export interface Palette {
  id: PaletteId
  section: PaletteSection
  isBase: boolean
  libraryName: string
  code: string
  note: string
  reason: string
  light: PaletteTokens
  dark: PaletteTokens
}

export const PALETTES: Palette[] = [
  {
    id: 'A',
    section: 'adhkar',
    isBase: true,
    libraryName: 'Bakery/Cafe',
    code: '#63',
    note: 'Warm brown + cream white',
    reason: 'الاتجاه الأساسي المطلوب: بني دافئ + كريمي — الأقرب إلى «المخطوطة الدافئة».',
    light: {
      paper: '#FEF3C7',
      card: '#FFFFFF',
      ink: '#78350F',
      muted: '#A06E46',
      border: '#FDE68A',
      strong: '#92400E',
      primary: '#92400E',
      soft: '#EFDAAD',
      accent: '#92400E',
      onPrimary: '#FFFFFF',
    },
    dark: {
      paper: '#140902',
      card: '#200E03',
      ink: '#E4D7CF',
      muted: '#A69991',
      border: '#3A302A',
      strong: '#AF744F',
      primary: '#9E5529',
      soft: '#3A1A06',
      accent: '#92400E',
      onPrimary: '#FFFFFF',
    },
  },
  {
    id: 'B',
    section: 'adhkar',
    isBase: false,
    libraryName: 'Veterinary Clinic',
    code: '#61',
    note: 'Caring teal + warm orange',
    reason: 'اتجاه بارد هادئ (تركوازي) — تباين لوني كامل مع الأساسي البني، ومختلف عن البديل البنفسجي.',
    light: {
      paper: '#F0FDFA',
      card: '#FFFFFF',
      ink: '#134E4A',
      muted: '#55827F',
      border: '#99F6E4',
      strong: '#0B7970',
      primary: '#0D9488',
      soft: '#D0EEEA',
      accent: '#EA580C',
      onPrimary: '#021614',
    },
    dark: {
      paper: '#021513',
      card: '#03211E',
      ink: '#D0DCDB',
      muted: '#92A09F',
      border: '#2A3A39',
      strong: '#0D9488',
      primary: '#0D9488',
      soft: '#053B36',
      accent: '#EA580C',
      onPrimary: '#021614',
    },
  },
  {
    id: 'C',
    section: 'adhkar',
    isBase: false,
    libraryName: 'Church/Religious Organization',
    code: '#74',
    note: 'Spiritual purple + warm gold',
    reason: 'اتجاه روحاني بنفسجي + ذهبي دافئ — محور لوني معاكس للأساسي، ويوحي بالتعبد.',
    light: {
      paper: '#FAF5FF',
      card: '#FFFFFF',
      ink: '#4C1D95',
      muted: '#805EB5',
      border: '#DDD6FE',
      strong: '#7C3AED',
      primary: '#7C3AED',
      soft: '#E8DBFC',
      accent: '#A16207',
      onPrimary: '#FFFFFF',
    },
    dark: {
      paper: '#110821',
      card: '#1B0D34',
      ink: '#DBD2EA',
      muted: '#9E95AE',
      border: '#373045',
      strong: '#9965F1',
      primary: '#7F3EED',
      soft: '#31175E',
      accent: '#A16207',
      onPrimary: '#FFFFFF',
    },
  },
  {
    id: 'A',
    section: 'prayer',
    isBase: true,
    libraryName: 'B2B Service',
    code: '#5',
    note: 'Professional navy + blue CTA',
    reason: 'الاتجاه الأساسي المطلوب: كحلي مهني + أزرق — «سماء الليل» الرسمية المتزنة.',
    light: {
      paper: '#F8FAFC',
      card: '#FFFFFF',
      ink: '#020617',
      muted: '#4C4F5C',
      border: '#E2E8F0',
      strong: '#0F172A',
      primary: '#0F172A',
      soft: '#D7DADF',
      accent: '#0369A1',
      onPrimary: '#FFFFFF',
    },
    dark: {
      paper: '#020306',
      card: '#030509',
      ink: '#CCCDD1',
      muted: '#8F9094',
      border: '#2A2B2E',
      strong: '#797D88',
      primary: '#616672',
      soft: '#060911',
      accent: '#0369A1',
      onPrimary: '#FFFFFF',
    },
  },
  {
    id: 'B',
    section: 'prayer',
    isBase: false,
    libraryName: 'Alarm & World Clock',
    code: '#117',
    note: 'Time amber + night indigo on dark',
    reason: 'اتجاه دافئ عنبري على ليل داكن — يربط بصريًا بأوقات الصلاة والشمس.',
    light: {
      paper: '#F4F4FE',
      card: '#FDFDFF',
      ink: '#623603',
      muted: '#8E6F4E',
      border: '#CDCDD5',
      strong: '#9E5704',
      primary: '#C36B05',
      soft: '#F0E2DB',
      accent: '#6366F1',
      onPrimary: '#1D1001',
    },
    dark: {
      paper: '#171F3E',
      card: '#22294B',
      ink: '#FFFFFF',
      muted: '#B7B9BF',
      border: '#353C4C',
      strong: '#D97706',
      primary: '#D97706',
      soft: '#4C341F',
      accent: '#6366F1',
      onPrimary: '#211201',
    },
  },
  {
    id: 'C',
    section: 'prayer',
    isBase: false,
    libraryName: 'Sleep Tracker',
    code: '#142',
    note: 'Night indigo + dream violet on dark',
    reason: 'اتجاه نيلي/بنفسجي تأملي — ليل هادئ مختلف عن الكحلي الأساسي وعن العنبري.',
    light: {
      paper: '#F6F1FE',
      card: '#FDFCFF',
      ink: '#1E195B',
      muted: '#5F5A8C',
      border: '#CFCAD5',
      strong: '#4338CA',
      primary: '#4338CA',
      soft: '#DDD7F7',
      accent: '#7C3AED',
      onPrimary: '#FFFFFF',
    },
    dark: {
      paper: '#1C1B41',
      card: '#27254E',
      ink: '#FFFFFF',
      muted: '#B7B9BF',
      border: '#353C4C',
      strong: '#837CDC',
      primary: '#675ED4',
      soft: '#1F215A',
      accent: '#7C3AED',
      onPrimary: '#FFFFFF',
    },
  },
]

export function getPalette(section: PaletteSection, id: PaletteId): Palette {
  const palette = PALETTES.find((p) => p.section === section && p.id === id)
  if (!palette) {
    throw new Error(`لوحة غير معروفة: ${section}/${id}`)
  }
  return palette
}

export function palettesFor(section: PaletteSection): Palette[] {
  return PALETTES.filter((p) => p.section === section)
}

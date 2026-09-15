import { AboutScreen } from '../components/about/AboutScreen'

interface AboutPageProps {
  onBack: () => void
}

export function AboutPage({ onBack }: AboutPageProps) {
  return <AboutScreen onBack={onBack} backLabel="← العودة إلى الإعدادات" />
}

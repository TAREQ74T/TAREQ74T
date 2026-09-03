import { useHoldStep } from '../../hooks/useHoldStep'

interface StepControlProps {
  onStep: () => void
  disabled?: boolean
  label: string
  ariaLabel: string
}

export function StepControl({
  onStep,
  disabled = false,
  label,
  ariaLabel,
}: StepControlProps) {
  const { start, stop } = useHoldStep(onStep, disabled)
  return (
    <button
      type="button"
      className="step-btn"
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onClick={(event) => event.preventDefault()}
    >
      {label}
    </button>
  )
}

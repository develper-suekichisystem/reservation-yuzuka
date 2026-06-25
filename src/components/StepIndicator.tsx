import type { Step } from '../types/index';

const STEPS: { key: Step; label: string }[] = [
  { key: 'menu',     label: 'メニュー' },
  { key: 'calendar', label: '日付' },
  { key: 'time',     label: '時間' },
  { key: 'location', label: '場所' },
  { key: 'form',     label: '入力' },
  { key: 'confirm',  label: '確認' },
  { key: 'complete', label: '完了' },
];

const STEP_INDEX: Record<Step, number> = {
  menu: 0, calendar: 1, time: 2, location: 3, form: 4, confirm: 5, complete: 6,
};

interface Props {
  currentStep: Step;
}

export function StepIndicator({ currentStep }: Props) {
  const currentIndex = STEP_INDEX[currentStep];

  return (
    <div className="step-indicator">
      {STEPS.map((step, index) => (
        <div
          key={step.key}
          className={`step-item ${index < currentIndex ? 'completed' : ''} ${index === currentIndex ? 'active' : ''}`}
        >
          <div className="step-circle">
            {index < currentIndex ? '✓' : index + 1}
          </div>
          <span className="step-label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

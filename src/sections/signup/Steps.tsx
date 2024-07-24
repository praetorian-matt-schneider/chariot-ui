import { cn } from '@/utils/classname';

interface Props {
  steps: {
    title: string;
    description: string;
    Content: React.ElementType;
  }[];
  currentStep: number;
  setCurrentStep: (index: number) => void;
}

export const Steps = (props: Props) => {
  const { steps = [], currentStep, setCurrentStep } = props;
  const Content = steps[currentStep].Content;

  return (
    <div className="space-y-8">
      <div className="flex border-2 border-default">
        {steps.map((step, index) => (
          <div
            className={cn(
              'grow px-4 py-2 cursor-pointer',
              index > 0 && 'border-0 border-l-2 border-default',
              currentStep !== index && 'bg-layer1 text-default-light'
            )}
            key={step.title}
            onClick={() => setCurrentStep(index)}
          >
            <h6
              className={cn(
                'text-xs font-semibold text-brand',
                currentStep < index && 'text-default-light'
              )}
            >
              {step.title}
            </h6>
            <p className="text-sm font-bold text-current">{step.description}</p>
          </div>
        ))}
      </div>
      <hr className="border-t-2 border-default" />
      <Content />
    </div>
  );
};

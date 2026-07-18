import React from 'react';
import { CheckCircle2, Circle, User, UserCheck, Shield } from 'lucide-react';

interface SignUpProgressProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  {
    id: 1,
    title: 'Choose Role',
    description: 'Select your professional role',
    icon: User
  },
  {
    id: 2,
    title: 'Personal Info',
    description: 'Enter your details',
    icon: UserCheck
  },
  {
    id: 3,
    title: 'Verification',
    description: 'Verify your account',
    icon: Shield
  }
];

const SignUpProgress: React.FC<SignUpProgressProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const IconComponent = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Step Circle */}
                <div
                  className={`
                    relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <IconComponent className="h-6 w-6" />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <div
                    className={`
                      text-sm font-medium transition-colors duration-300
                      ${
                        isCompleted || isCurrent
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`
                      text-xs mt-1 transition-colors duration-300
                      ${
                        isCompleted || isCurrent
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.description}
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      absolute top-6 start-12 w-full h-0.5 transition-colors duration-300
                      ${
                        currentStep > step.id
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }
                    `}
                    style={{
                      width: 'calc(100vw / 3 - 3rem)',
                      maxWidth: '200px'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Percentage */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpProgress;


import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface OnboardingWrapperProps {
  hasCompletedOnboarding: boolean;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ hasCompletedOnboarding }) => {
  const [currentStep, setCurrentStep] = useState(hasCompletedOnboarding ? 3 : 0);
  const [formData, setFormData] = useState({
    name: "",
    jobInterests: [],
    skillLevel: "",
    preferences: {}
  });

  const steps = [
    {
      title: "Welcome to Emirati Journey",
      description: "Let's personalize your experience. This will only take a minute.",
    },
    {
      title: "Tell us about yourself",
      description: "Help us understand your career goals and interests.",
    },
    {
      title: "Almost there!",
      description: "Just a few more details to get you started.",
    },
    {
      title: "You're all set!",
      description: "Thank you for completing the onboarding process.",
    }
  ];

  const handleClose = () => {
    if (currentStep >= 3) {
      // If they've completed onboarding, save that info
      try {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        localStorage.setItem('userProfile', JSON.stringify(formData));
      } catch (error) {
        console.error("Error saving onboarding data:", error);
      }
    }
    
    // Close modal by refreshing the page
    window.location.reload();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const completeOnboarding = () => {
    try {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.setItem('userProfile', JSON.stringify(formData));
      
      toast({
        title: "Onboarding Complete",
        description: "Your profile has been saved. Enjoy Emirati Journey!",
      });
      
      handleClose();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-display font-semibold text-emirati-navy">
              {steps[currentStep].title}
            </h2>
            <p className="text-foreground/70 mt-2">
              {steps[currentStep].description}
            </p>
          </div>
          
          {/* Step progress indicator */}
          <div className="flex mb-8">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`h-1 rounded-full flex-1 mx-1 ${
                  index <= currentStep ? 'bg-emirati-teal' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          {/* Step content */}
          <div className="mb-8">
            {currentStep === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emirati-teal/10 flex items-center justify-center mx-auto mb-4 text-emirati-teal">
                  <span className="text-3xl">👋</span>
                </div>
                <p className="text-lg">Welcome! We're excited to have you join us.</p>
              </div>
            )}
            
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Career Stage
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    onChange={(e) => setFormData(prev => ({...prev, skillLevel: e.target.value}))}
                  >
                    <option value="">Select your current stage</option>
                    <option value='candidate'>Student</option>
                    <option value="graduate">Recent Graduate</option>
                    <option value="professional">Professional</option>
                    <option value="manager">Manager/Leader</option>
                    <option value='candidate'>Retiree</option>
                  </select>
                </div>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What are you most interested in?
                  </label>
                  <div className="space-y-2">
                    {['Resume Building', 'Career Advice', 'Training Courses', 'Job Opportunities', 'Mentoring'].map(interest => (
                      <label key={interest} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev, 
                                jobInterests: [...prev.jobInterests, interest]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                jobInterests: prev.jobInterests.filter(i => i !== interest)
                              }));
                            }
                          }}
                        />
                        {interest}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600">
                  <span className="text-3xl">✅</span>
                </div>
                <p className="text-lg">You're all set! Your profile has been created.</p>
                <p className="text-gray-500 mt-2">Explore the platform to discover all our features.</p>
              </div>
            )}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between">
            {currentStep > 0 && currentStep < 3 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            )}
            
            <div className={currentStep === 0 ? "mx-auto" : "ml-auto"}>
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-emirati-teal text-white rounded-full hover:bg-emirati-teal/90 transition-colors"
                >
                  {currentStep === steps.length - 2 ? "Complete" : "Next"}
                </button>
              ) : (
                <button
                  onClick={completeOnboarding}
                  className="px-6 py-2 bg-emirati-teal text-white rounded-full hover:bg-emirati-teal/90 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWrapper;

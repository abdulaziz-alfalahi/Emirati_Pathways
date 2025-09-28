import { useState, useEffect } from 'react';

interface DemoModeState {
  isActive: boolean;
  currentStep: string;
  highlightedElement: string | null;
}

export const useDemoMode = () => {
  const [demoState, setDemoState] = useState<DemoModeState>({
    isActive: false,
    currentStep: '',
    highlightedElement: null
  });

  const startDemo = (step: string) => {
    setDemoState({
      isActive: true,
      currentStep: step,
      highlightedElement: null
    });
  };

  const highlightElement = (selector: string) => {
    setDemoState(prev => ({
      ...prev,
      highlightedElement: selector
    }));

    // Add highlight class to element
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('demo-highlight');
      
      // Remove highlight after demo step
      setTimeout(() => {
        element.classList.remove('demo-highlight');
      }, 4000);
    }
  };

  const endDemo = () => {
    // Remove all demo highlights
    document.querySelectorAll('.demo-highlight').forEach(el => {
      el.classList.remove('demo-highlight');
    });

    setDemoState({
      isActive: false,
      currentStep: '',
      highlightedElement: null
    });
  };

  useEffect(() => {
    // Listen for demo events from the demo component
    const handleDemoEvent = (event: CustomEvent) => {
      const { type, step, selector } = event.detail;
      
      switch (type) {
        case 'start':
          startDemo(step);
          break;
        case 'highlight':
          highlightElement(selector);
          break;
        case 'end':
          endDemo();
          break;
      }
    };

    window.addEventListener('demo-event' as any, handleDemoEvent);
    
    return () => {
      window.removeEventListener('demo-event' as any, handleDemoEvent);
    };
  }, []);

  return {
    demoState,
    startDemo,
    highlightElement,
    endDemo
  };
};

export default useDemoMode;

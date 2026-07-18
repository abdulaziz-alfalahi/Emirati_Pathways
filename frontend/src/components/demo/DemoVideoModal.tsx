import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface DemoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoVideoModal: React.FC<DemoVideoModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Demo content sections
  const demoSections = [
    {
      title: "Platform Overview",
      duration: "2:30",
      description: "Comprehensive introduction to the Emirati Pathways ecosystem"
    },
    {
      title: "Candidate Journey",
      duration: "3:15", 
      description: "How UAE nationals discover opportunities and build careers"
    },
    {
      title: "HR & Recruitment",
      duration: "2:45",
      description: "Advanced talent acquisition and management tools"
    },
    {
      title: "AI-Powered Matching",
      duration: "3:00",
      description: "Intelligent career and skill matching technology"
    },
    {
      title: "Success Stories",
      duration: "2:20",
      description: "Real testimonials from platform users"
    }
  ];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-teal-50 to-emerald-50">
          <div>
            <h2 className="text-2xl font-dubai-bold text-slate-900">
              Emirati Pathways Platform Demo
            </h2>
            <p className="text-slate-600 mt-1">
              Discover how our AI-powered platform transforms UAE career development
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Video Player Section */}
          <div className="flex-1 bg-black relative">
            {/* Placeholder Video Area */}
            <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
              {/* Video Placeholder */}
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-12 h-12 ms-1" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Platform Demo Video</h3>
                <p className="text-gray-300">
                  Comprehensive walkthrough of all platform features
                </p>
              </div>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black to-transparent p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-600 rounded-full h-1">
                    <div 
                      className="bg-teal-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePlayPause}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </button>
                    
                    <button
                      onClick={handleMuteToggle}
                      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>

                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration || 780)} {/* 13 minutes total */}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                      <RotateCcw className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                      <Maximize className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Sections Sidebar */}
          <div className="w-full lg:w-80 bg-gray-50 p-6">
            <h3 className="text-lg font-dubai-bold text-slate-900 mb-4">
              Demo Sections
            </h3>
            
            <div className="space-y-3">
              {demoSections.map((section, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-4 border hover:border-teal-300 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-dubai-medium text-slate-900 group-hover:text-teal-600 transition-colors">
                        {section.title}
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        {section.description}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {section.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Key Features */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-dubai-medium text-slate-900 mb-3">
                What You'll Learn
              </h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full me-3"></div>
                  AI-powered career matching
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full me-3"></div>
                  Multi-role dashboard system
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full me-3"></div>
                  Bilingual platform support
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full me-3"></div>
                  Advanced analytics & reporting
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full me-3"></div>
                  Government compliance features
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={onClose}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg font-dubai-medium transition-colors"
              >
                Start Your Journey
              </button>
              <p className="text-xs text-slate-500 text-center mt-2">
                Ready to transform UAE career development?
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoVideoModal;

import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComingSoonProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = "Module Under Development", 
  description = "This platform feature is currently being upgraded or is temporarily disabled by an Administrator. Please check back later.",
  showBackButton = true
}) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Construction className="w-10 h-10 text-blue-600 -rotate-3" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3 font-dubai-bold">
            {title}
          </h2>
          
          <p className="text-gray-500 mb-8 font-dubai-regular leading-relaxed">
            {description}
          </p>
          
          <div className="flex flex-col gap-3">
            {showBackButton && (
              <button 
                onClick={() => navigate(-1)}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1"></div>
      </div>
    </div>
  );
};

export default ComingSoon;

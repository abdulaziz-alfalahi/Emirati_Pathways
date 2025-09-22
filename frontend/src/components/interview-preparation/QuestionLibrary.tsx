
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Bookmark, Eye, TrendingUp } from 'lucide-react';

export const QuestionLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const questions = [
    {
      id: 1,
      question: "Tell me about yourself and your background.",
      category: "General",
      level: "Entry",
      difficulty: "Easy",
      industry: "All",
      starMethod: true,
      saved: false,
      views: 1250
    },
    {
      id: 2,
      question: "Describe a challenging project you worked on and how you overcame obstacles.",
      category: "Behavioral",
      level: "Mid",
      difficulty: "Medium",
      industry: "Technology",
      starMethod: true,
      saved: true,
      views: 890
    },
    {
      id: 3,
      question: "How do you stay updated with the latest trends in your field?",
      category: "Technical",
      level: "Senior",
      difficulty: "Medium",
      industry: "All",
      starMethod: false,
      saved: false,
      views: 567
    },
    {
      id: 4,
      question: "What do you know about UAE's D33 Vision and how does it relate to your career goals?",
      category: "Cultural",
      level: "All",
      difficulty: "Medium",
      industry: "Government",
      starMethod: false,
      saved: true,
      views: 445
    }
  ];

  const categories = ["All", "General", "Behavioral", "Technical", "Cultural", "Leadership"];
  const levels = ["All", "Entry", "Mid", "Senior"];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || q.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesLevel = levelFilter === 'all' || q.level.toLowerCase() === levelFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Career Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level.toLowerCase()}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved ({questions.filter(q => q.saved).length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* STAR Method Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">STAR Method Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="font-bold text-ehrdc-teal text-xl mb-2">S</div>
              <div className="font-semibold">Situation</div>
              <div className="text-sm text-gray-600 mt-1">Set the context</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="font-bold text-ehrdc-teal text-xl mb-2">T</div>
              <div className="font-semibold">Task</div>
              <div className="text-sm text-gray-600 mt-1">Describe your responsibility</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="font-bold text-ehrdc-teal text-xl mb-2">A</div>
              <div className="font-semibold">Action</div>
              <div className="text-sm text-gray-600 mt-1">Explain what you did</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="font-bold text-ehrdc-teal text-xl mb-2">R</div>
              <div className="font-semibold">Result</div>
              <div className="text-sm text-gray-600 mt-1">Share the outcome</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ehrdc-teal">
          {filteredQuestions.length} Questions Found
        </h2>
        
        {filteredQuestions.map((question) => (
          <Card key={question.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{question.question}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{question.category}</Badge>
                    <Badge variant="outline">{question.level}</Badge>
                    <Badge variant="outline">{question.difficulty}</Badge>
                    {question.starMethod && (
                      <Badge className="bg-ehrdc-teal">STAR Method</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {question.views} views
                    </div>
                    <div>Industry: {question.industry}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Bookmark className={`h-4 w-4 ${question.saved ? 'fill-ehrdc-teal text-ehrdc-teal' : ''}`} />
                  </Button>
                  <Button size="sm" className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                    Practice
                  </Button>
                </div>
              </div>
              
              {question.starMethod && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">STAR Method Tips:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div><strong>Situation:</strong> Describe the context</div>
                    <div><strong>Task:</strong> Explain your responsibility</div>
                    <div><strong>Action:</strong> Detail your approach</div>
                    <div><strong>Result:</strong> Share the positive outcome</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

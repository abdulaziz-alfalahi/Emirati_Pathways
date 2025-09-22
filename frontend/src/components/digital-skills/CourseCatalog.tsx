
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Users, Play } from 'lucide-react';

const courses = [
  {
    title: 'Introduction to Python Programming',
    description: 'Learn Python from scratch with hands-on projects',
    instructor: 'Dr. Sarah Ahmed',
    duration: '40 hours',
    students: 3500,
    rating: 4.8,
    price: 'Free',
    level: 'Beginner',
    category: 'Programming'
  },
  {
    title: 'Advanced Excel for Data Analysis',
    description: 'Master Excel formulas, pivot tables, and data visualization',
    instructor: 'Mohammed Al-Rashid',
    duration: '25 hours',
    students: 2200,
    rating: 4.6,
    price: 'AED 299',
    level: 'Intermediate',
    category: 'Data Analysis'
  },
  {
    title: 'Digital Marketing Fundamentals',
    description: 'Comprehensive guide to modern digital marketing strategies',
    instructor: 'Fatima Hassan',
    duration: '30 hours',
    students: 1800,
    rating: 4.7,
    price: 'AED 199',
    level: 'Beginner',
    category: 'Marketing'
  },
  {
    title: 'Cloud Computing with AWS',
    description: 'Learn cloud infrastructure and services with Amazon Web Services',
    instructor: 'Ahmed Khalil',
    duration: '60 hours',
    students: 1200,
    rating: 4.9,
    price: 'AED 599',
    level: 'Advanced',
    category: 'Cloud Computing'
  }
];

export const CourseCatalog: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {courses.map((course, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                  <p className="text-sm font-medium">By {course.instructor}</p>
                </div>
                <Badge variant={course.level === 'Advanced' ? 'default' : 'secondary'}>
                  {course.level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {course.students.toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {course.rating}
                </div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{course.category}</Badge>
                  <span className="font-semibold text-lg">{course.price}</span>
                </div>
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Enroll
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

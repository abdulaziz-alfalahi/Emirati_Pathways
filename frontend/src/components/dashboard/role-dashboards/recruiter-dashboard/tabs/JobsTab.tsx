
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const JobsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Management</CardTitle>
        <CardDescription>Create and manage job listings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Link to="/job-descriptions">
          <Button className="w-full justify-start">
            <Briefcase className="me-2 h-4 w-4" /> Post New Job
          </Button>
        </Link>
        <div className="border rounded-lg divide-y">
          <div className="p-4">
            <div className="flex justify-between">
              <h3 className="font-medium">Senior Software Engineer</h3>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">15 applications • Posted 5 days ago</p>
          </div>
          <div className="p-4">
            <div className="flex justify-between">
              <h3 className="font-medium">Marketing Manager</h3>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">23 applications • Posted 2 days ago</p>
          </div>
          <div className="p-4">
            <div className="flex justify-between">
              <h3 className="font-medium">Finance Intern</h3>
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Draft</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Not published</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobsTab;

import React, { useState, useEffect } from 'react';
import { getDisplayName } from '@/utils/nameUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  Edit,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  UserPlus,
  Download,
  Upload,
  BarChart3,
  Target,
  Award,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  User
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  arabicName: string;
  studentId: string;
  grade: string;
  class: string;
  dateOfBirth: string;
  nationality: string;
  emirate: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  attendanceRate: number;
  overallGrade: number;
  status: 'active' | 'inactive' | 'transferred';
  lastActivity: string;
  specialNeeds?: string;
  medicalConditions?: string;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

interface ProgressRecord {
  subject: string;
  currentGrade: number;
  previousGrade: number;
  trend: 'improving' | 'declining' | 'stable';
  lastAssessment: string;
}

const StudentTracking: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual API call
      const mockStudents: Student[] = [
        {
          id: '1',
          firstName: 'Ahmed',
          lastName: 'Al Mansouri',
          arabicName: 'أحمد المنصوري',
          studentId: 'STU001',
          grade: '5',
          class: '5A',
          dateOfBirth: '2014-03-15',
          nationality: 'UAE',
          emirate: 'Dubai',
          guardianName: 'Mohammed Al Mansouri',
          guardianPhone: '+971501234567',
          guardianEmail: 'mohammed.almansouri@email.com',
          attendanceRate: 95.5,
          overallGrade: 88.2,
          status: 'active',
          lastActivity: '2025-09-20',
          specialNeeds: 'None',
          medicalConditions: 'None'
        },
        {
          id: '2',
          firstName: 'Fatima',
          lastName: 'Al Zahra',
          arabicName: 'فاطمة الزهراء',
          studentId: 'STU002',
          grade: '5',
          class: '5A',
          dateOfBirth: '2014-07-22',
          nationality: 'UAE',
          emirate: 'Abu Dhabi',
          guardianName: 'Aisha Al Zahra',
          guardianPhone: '+971507654321',
          guardianEmail: 'aisha.alzahra@email.com',
          attendanceRate: 92.8,
          overallGrade: 91.5,
          status: 'active',
          lastActivity: '2025-09-20',
          specialNeeds: 'None',
          medicalConditions: 'Asthma'
        },
        {
          id: '3',
          firstName: 'Omar',
          lastName: 'Al Rashid',
          arabicName: 'عمر الراشد',
          studentId: 'STU003',
          grade: '5',
          class: '5B',
          dateOfBirth: '2014-01-10',
          nationality: 'UAE',
          emirate: 'Sharjah',
          guardianName: 'Khalid Al Rashid',
          guardianPhone: '+971509876543',
          guardianEmail: 'khalid.alrashid@email.com',
          attendanceRate: 89.2,
          overallGrade: 76.8,
          status: 'active',
          lastActivity: '2025-09-19',
          specialNeeds: 'Learning Support',
          medicalConditions: 'None'
        }
      ];

      setStudents(mockStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId: string) => {
    try {
      // Mock attendance data
      setAttendanceRecords([
        { date: '2025-09-20', status: 'present' },
        { date: '2025-09-19', status: 'present' },
        { date: '2025-09-18', status: 'late', notes: 'Traffic delay' },
        { date: '2025-09-17', status: 'present' },
        { date: '2025-09-16', status: 'absent', notes: 'Sick leave' }
      ]);

      // Mock progress data
      setProgressRecords([
        { subject: 'Mathematics', currentGrade: 88, previousGrade: 85, trend: 'improving', lastAssessment: '2025-09-15' },
        { subject: 'Arabic', currentGrade: 92, previousGrade: 90, trend: 'improving', lastAssessment: '2025-09-14' },
        { subject: 'Science', currentGrade: 76, previousGrade: 82, trend: 'declining', lastAssessment: '2025-09-13' },
        { subject: 'English', currentGrade: 84, previousGrade: 84, trend: 'stable', lastAssessment: '2025-09-12' },
        { subject: 'Islamic Studies', currentGrade: 95, previousGrade: 93, trend: 'improving', lastAssessment: '2025-09-11' }
      ]);
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesClass = filterClass === 'all' || student.class === filterClass;
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    
    return matchesSearch && matchesGrade && matchesClass && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-gray-600" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    fetchStudentDetails(student.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor student progress, attendance, and performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 me-2" />
            Export Data
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 me-2" />
            Import Students
          </Button>
          <Button onClick={() => setShowAddStudent(true)}>
            <UserPlus className="h-4 w-4 me-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute start-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="1">Grade 1</SelectItem>
                  <SelectItem value="2">Grade 2</SelectItem>
                  <SelectItem value="3">Grade 3</SelectItem>
                  <SelectItem value="4">Grade 4</SelectItem>
                  <SelectItem value="5">Grade 5</SelectItem>
                  <SelectItem value="6">Grade 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="5A">5A</SelectItem>
                  <SelectItem value="5B">5B</SelectItem>
                  <SelectItem value="5C">5C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 me-2" />
                Students ({filteredStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div 
                    key={student.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedStudent?.id === student.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleStudentSelect(student)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getDisplayName(student)}
                          </p>
                          <p className="text-sm text-gray-600">{student.arabicName}</p>
                          <p className="text-xs text-gray-500">
                            {student.studentId} • Grade {student.grade} • Class {student.class}
                          </p>
                        </div>
                      </div>
                      <div className="text-end">
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                        <div className="mt-2 space-y-1">
                          <p className={`text-sm font-medium ${getAttendanceColor(student.attendanceRate)}`}>
                            {student.attendanceRate}% Attendance
                          </p>
                          <p className={`text-sm font-medium ${getGradeColor(student.overallGrade)}`}>
                            {student.overallGrade}% Overall
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Details */}
        <div>
          {selectedStudent ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 me-2" />
                  Student Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="profile" className="space-y-4">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg">
                        {getDisplayName(selectedStudent)}
                      </h3>
                      <p className="text-gray-600">{selectedStudent.arabicName}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Student ID:</span>
                        <span className="text-sm font-medium">{selectedStudent.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Grade & Class:</span>
                        <span className="text-sm font-medium">Grade {selectedStudent.grade} - {selectedStudent.class}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date of Birth:</span>
                        <span className="text-sm font-medium">{selectedStudent.dateOfBirth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Nationality:</span>
                        <span className="text-sm font-medium">{selectedStudent.nationality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Emirate:</span>
                        <span className="text-sm font-medium">{selectedStudent.emirate}</span>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">Guardian Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedStudent.guardianName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedStudent.guardianPhone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{selectedStudent.guardianEmail}</span>
                        </div>
                      </div>
                    </div>

                    {(selectedStudent.specialNeeds !== 'None' || selectedStudent.medicalConditions !== 'None') && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium mb-2">Special Considerations</h4>
                        {selectedStudent.specialNeeds !== 'None' && (
                          <div className="mb-2">
                            <span className="text-sm text-gray-600">Special Needs:</span>
                            <p className="text-sm">{selectedStudent.specialNeeds}</p>
                          </div>
                        )}
                        {selectedStudent.medicalConditions !== 'None' && (
                          <div>
                            <span className="text-sm text-gray-600">Medical Conditions:</span>
                            <p className="text-sm">{selectedStudent.medicalConditions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="attendance" className="space-y-3">
                    <div className="text-center mb-4">
                      <p className={`text-2xl font-bold ${getAttendanceColor(selectedStudent.attendanceRate)}`}>
                        {selectedStudent.attendanceRate}%
                      </p>
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                    </div>
                    
                    <div className="space-y-2">
                      {attendanceRecords.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded border">
                          <span className="text-sm">{record.date}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                              {record.status}
                            </Badge>
                            {record.notes && (
                              <span className="text-xs text-gray-500">{record.notes}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="progress" className="space-y-3">
                    <div className="text-center mb-4">
                      <p className={`text-2xl font-bold ${getGradeColor(selectedStudent.overallGrade)}`}>
                        {selectedStudent.overallGrade}%
                      </p>
                      <p className="text-sm text-gray-600">Overall Grade</p>
                    </div>
                    
                    <div className="space-y-3">
                      {progressRecords.map((record, index) => (
                        <div key={index} className="p-3 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{record.subject}</span>
                            {getTrendIcon(record.trend)}
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Current: {record.currentGrade}%</span>
                            <span className="text-gray-600">Previous: {record.previousGrade}%</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Last assessment: {record.lastAssessment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a student to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentTracking;

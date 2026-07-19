import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Code, 
  Calendar, 
  ExternalLink, 
  Github,
  Edit,
  Save,
  X,
  Folder
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Project } from '@/types/cv';

interface ProjectsStepProps {
  data: { projects?: Project[] };
  onChange: (section: string, data: Project[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EMPTY_PROJECT: Project = {
  id: '',
  name: '',
  description: '',
  technologies: [],
  startDate: '',
  endDate: '',
  isOngoing: false,
  url: '',
  githubUrl: '',
  achievements: []
};

const POPULAR_TECHNOLOGIES = [
  // Frontend
  'React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Sass', 'Tailwind CSS',
  // Backend
  'Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
  // Databases
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI',
  // Mobile
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin',
  // Other
  'Git', 'REST API', 'GraphQL', 'Microservices', 'Machine Learning', 'AI', 'Blockchain'
];

export const ProjectsStep: React.FC<ProjectsStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>(data.projects || []);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [currentProject, setCurrentProject] = useState<Project>(EMPTY_PROJECT);
  const [newTechnology, setNewTechnology] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  const handleAddProject = () => {
    const newProject = {
      ...EMPTY_PROJECT,
      id: `project_${Date.now()}`
    };
    setCurrentProject(newProject);
    setEditingIndex(projects.length);
  };

  const handleEditProject = (index: number) => {
    setCurrentProject(projects[index]);
    setEditingIndex(index);
  };

  const handleSaveProject = () => {
    if (!currentProject.name || !currentProject.description) {
      return;
    }

    const updatedProjects = [...projects];
    if (editingIndex === projects.length) {
      // Adding new project
      updatedProjects.push(currentProject);
    } else {
      // Editing existing project
      updatedProjects[editingIndex] = currentProject;
    }

    // Sort by start date (most recent first)
    updatedProjects.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    setProjects(updatedProjects);
    onChange('projects', updatedProjects);
    setEditingIndex(-1);
    setCurrentProject(EMPTY_PROJECT);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setCurrentProject(EMPTY_PROJECT);
  };

  const handleDeleteProject = (index: number) => {
    const updatedProjects = projects.filter((_, i) => i !== index);
    setProjects(updatedProjects);
    onChange('projects', updatedProjects);
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    setCurrentProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTechnology = () => {
    if (newTechnology.trim() && !currentProject.technologies.includes(newTechnology.trim())) {
      const updatedTechnologies = [...currentProject.technologies, newTechnology.trim()];
      setCurrentProject(prev => ({
        ...prev,
        technologies: updatedTechnologies
      }));
      setNewTechnology('');
    }
  };

  const handleRemoveTechnology = (index: number) => {
    const updatedTechnologies = currentProject.technologies.filter((_, i) => i !== index);
    setCurrentProject(prev => ({
      ...prev,
      technologies: updatedTechnologies
    }));
  };

  const handleAddPresetTechnology = (tech: string) => {
    if (!currentProject.technologies.includes(tech)) {
      const updatedTechnologies = [...currentProject.technologies, tech];
      setCurrentProject(prev => ({
        ...prev,
        technologies: updatedTechnologies
      }));
    }
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      const updatedAchievements = [...currentProject.achievements, newAchievement.trim()];
      setCurrentProject(prev => ({
        ...prev,
        achievements: updatedAchievements
      }));
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (index: number) => {
    const updatedAchievements = currentProject.achievements.filter((_, i) => i !== index);
    setCurrentProject(prev => ({
      ...prev,
      achievements: updatedAchievements
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t('cv.builder.projects.title', 'Projects & Portfolio')}
        </h2>
        <p className="text-muted-foreground">
          {t('cv.builder.projects.description', 'Showcase your key projects and technical achievements')}
        </p>
      </div>

      {/* Existing Projects */}
      <div className="space-y-4">
        {projects.map((project, index) => (
          <Card key={project.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Folder className="h-5 w-5 me-2" />
                  {project.name}
                  {project.isOngoing && (
                    <Badge variant="secondary" className="ms-2">
                      {t('cv.builder.projects.ongoing', 'Ongoing')}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProject(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProject(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 me-2" />
                  {project.startDate} - {project.isOngoing ? 'Present' : project.endDate}
                </div>
                
                <p className="text-sm">{project.description}</p>
                
                {project.technologies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      {t('cv.builder.projects.technologies', 'Technologies Used')}:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Code className="h-3 w-3 me-1" />
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.achievements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {t('cv.builder.projects.achievements', 'Key Achievements')}:
                    </p>
                    <ul className="text-sm space-y-1">
                      {project.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-primary me-2">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex space-x-4">
                  {project.url && (
                    <a 
                      href={project.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4 me-1" />
                      {t('cv.builder.projects.viewProject', 'View Project')}
                    </a>
                  )}
                  {project.githubUrl && (
                    <a 
                      href={project.githubUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                    >
                      <Github className="h-4 w-4 me-1" />
                      {t('cv.builder.projects.viewCode', 'View Code')}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Project Form */}
      {editingIndex >= 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingIndex === projects.length 
                ? t('cv.builder.projects.add', 'Add New Project')
                : t('cv.builder.projects.edit', 'Edit Project')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectName">
                {t('cv.builder.projects.name', 'Project Name')} *
              </Label>
              <Input
                id="projectName"
                value={currentProject.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder={t('cv.builder.projects.namePlaceholder', 'e.g., E-commerce Mobile App')}
              />
            </div>

            <div>
              <Label htmlFor="projectDescription">
                {t('cv.builder.projects.description', 'Project Description')} *
              </Label>
              <Textarea
                id="projectDescription"
                value={currentProject.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={t('cv.builder.projects.descriptionPlaceholder', 'Describe the project, your role, and the problem it solved...')}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">
                  {t('cv.builder.projects.startDate', 'Start Date')} *
                </Label>
                <Input
                  id="startDate"
                  type="month"
                  value={currentProject.startDate}
                  onChange={(e) => handleFieldChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">
                  {t('cv.builder.projects.endDate', 'End Date')}
                </Label>
                <Input
                  id="endDate"
                  type="month"
                  value={currentProject.endDate}
                  onChange={(e) => handleFieldChange('endDate', e.target.value)}
                  disabled={currentProject.isOngoing}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isOngoing"
                  checked={currentProject.isOngoing}
                  onCheckedChange={(checked) => {
                    handleFieldChange('isOngoing', checked);
                    if (checked) {
                      handleFieldChange('endDate', '');
                    }
                  }}
                />
                <Label htmlFor="isOngoing" className="text-sm">
                  {t('cv.builder.projects.ongoing', 'Ongoing project')}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectUrl">
                  {t('cv.builder.projects.url', 'Project URL')}
                </Label>
                <Input
                  id="projectUrl"
                  value={currentProject.url}
                  onChange={(e) => handleFieldChange('url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="githubUrl">
                  {t('cv.builder.projects.githubUrl', 'GitHub URL')}
                </Label>
                <Input
                  id="githubUrl"
                  value={currentProject.githubUrl}
                  onChange={(e) => handleFieldChange('githubUrl', e.target.value)}
                  placeholder="https://github.com/..."
                />
              </div>
            </div>

            {/* Technologies */}
            <div>
              <Label>{t('cv.builder.projects.technologies', 'Technologies Used')}</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {currentProject.technologies.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer">
                      <Code className="h-3 w-3 me-1" />
                      {tech}
                      <X 
                        className="h-3 w-3 ms-1" 
                        onClick={() => handleRemoveTechnology(index)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    placeholder={t('cv.builder.projects.technologyPlaceholder', 'Add a technology...')}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTechnology()}
                  />
                  <Button onClick={handleAddTechnology}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Popular Technologies */}
                <div>
                  <p className="text-sm font-medium mb-2">
                    {t('cv.builder.projects.popularTech', 'Popular Technologies')}:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_TECHNOLOGIES.filter(tech => 
                      !currentProject.technologies.includes(tech)
                    ).slice(0, 15).map((tech) => (
                      <Button
                        key={tech}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddPresetTechnology(tech)}
                        className="text-xs h-6"
                      >
                        <Plus className="h-2 w-2 me-1" />
                        {tech}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <Label>{t('cv.builder.projects.achievements', 'Key Achievements')}</Label>
              <div className="space-y-2">
                {currentProject.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={achievement} readOnly className="flex-1" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAchievement(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder={t('cv.builder.projects.achievementPlaceholder', 'e.g., Increased user engagement by 40%')}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
                  />
                  <Button onClick={handleAddAchievement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveProject}>
                <Save className="h-4 w-4 me-2" />
                {t('common.save', 'Save')}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 me-2" />
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Project Button */}
      {editingIndex === -1 && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-primary cursor-pointer transition-colors">
          <CardContent className="flex items-center justify-center py-8" onClick={handleAddProject}>
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">
                {t('cv.builder.projects.addNew', 'Add Project')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Summary */}
      {projects.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">
              {t('cv.builder.projects.summary', 'Projects Summary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {projects.length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.projects.total', 'Total Projects')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {projects.filter(p => p.isOngoing).length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.projects.ongoing', 'Ongoing')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {projects.reduce((acc, project) => acc + project.technologies.length, 0)}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.projects.technologies', 'Technologies')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {projects.filter(p => p.url || p.githubUrl).length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.projects.withLinks', 'With Links')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UAE Project Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">
            {t('cv.builder.projects.uaeTips', 'UAE Project Tips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• {t('cv.builder.projects.tip1', 'Include projects that demonstrate problem-solving skills')}</p>
            <p>• {t('cv.builder.projects.tip2', 'Highlight projects with measurable business impact')}</p>
            <p>• {t('cv.builder.projects.tip3', 'Showcase modern technologies relevant to UAE market')}</p>
            <p>• {t('cv.builder.projects.tip4', 'Include collaborative projects to show teamwork abilities')}</p>
            <p>• {t('cv.builder.projects.tip5', 'Provide working links when possible for portfolio verification')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          {t('common.previous', 'Previous')}
        </Button>
        <Button onClick={onNext}>
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
};


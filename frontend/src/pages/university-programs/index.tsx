import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EducationPathwayLayout } from '@/components/layouts/EducationPathwayLayout';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Users, Building, Calendar, Globe, BookOpen, University, Trophy, Target, TrendingUp } from 'lucide-react';
import UniversityProgramsFilter from '@/components/university-programs/UniversityProgramsFilter';
import ProgramsList from '@/components/university-programs/ProgramsList';
import RecommendedPrograms from '@/components/university-programs/RecommendedPrograms';
import MyApplications from '@/components/university-programs/MyApplications';
import SavedPrograms from '@/components/university-programs/SavedPrograms';
import type { StatItem, TabItem } from '@/components/layouts/EducationPathwayLayout';

interface FilterState {
  search: string;
  university: string;
  degreeLevel: string;
  fieldOfStudy: string;
  location: string;
  language: string;
}

const UniversityProgramsPage: React.FC = () => {
  const { t } = useTranslation('university-programs');
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    university: '',
    degreeLevel: '',
    fieldOfStudy: '',
    location: '',
    language: '',
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['university-programs-filter-options'],
    queryFn: async () => {
      const { data: programs, error } = await supabase
        .from('university_programs')
        .select('university_name, degree_level, field_of_study')
        .eq('is_active', true);
      
      if (error) throw error;

      const universities = [...new Set(programs.map(p => p.university_name))].sort();
      const degreeLevels = [...new Set(programs.map(p => p.degree_level))].sort();
      const fieldsOfStudy = [...new Set(programs.map(p => p.field_of_study))].sort();

      return { universities, degreeLevels, fieldsOfStudy };
    }
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['university-programs-stats'],
    queryFn: async () => {
      const { data: programs, error } = await supabase
        .from('university_programs')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;

      const totalPrograms = programs.length;
      const universities = new Set(programs.map(p => p.university_name)).size;
      const fields = new Set(programs.map(p => p.field_of_study)).size;
      const international = programs.filter(p => p.university_name.includes('Cambridge') || p.university_name.includes('MIT')).length;

      return { totalPrograms, universities, fields, international };
    }
  });

  // Education stats for the layout
  const educationStats: StatItem[] = [
    {
      value: `${stats?.totalPrograms || 0}+`,
      label: t('stats.universityPrograms.label'),
      icon: University
    },
    {
      value: `${stats?.universities || 0}+`,
      label: t('stats.partnerUniversities.label'),
      icon: Building
    },
    {
      value: `${stats?.fields || 0}+`,
      label: t('stats.fieldsOfStudy.label'),
      icon: BookOpen
    },
    {
      value: `${stats?.international || 0}+`,
      label: t('stats.internationalPrograms.label'),
      icon: Globe
    }
  ];

  // Education tabs with university program content
  const educationTabs: TabItem[] = [
    {
      id: "all-programs",
      label: t('tabs.allPrograms'),
      icon: <University className="h-4 w-4" />,
      content: (
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            {filterOptions && (
              <UniversityProgramsFilter
                filters={filters}
                onFilterChange={setFilters}
                universities={filterOptions.universities}
                degreeLevels={filterOptions.degreeLevels}
                fieldsOfStudy={filterOptions.fieldsOfStudy}
              />
            )}
          </div>
          <div className="lg:col-span-3">
            <ProgramsList filters={filters} />
          </div>
        </div>
      )
    },
    {
      id: "recommended",
      label: t('tabs.recommended'),
      icon: <Target className="h-4 w-4" />,
      content: (
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="lg:col-span-1">
            {filterOptions && (
              <UniversityProgramsFilter
                filters={filters}
                onFilterChange={setFilters}
                universities={filterOptions.universities}
                degreeLevels={filterOptions.degreeLevels}
                fieldsOfStudy={filterOptions.fieldsOfStudy}
              />
            )}
          </div>
          <div className="lg:col-span-3">
            <RecommendedPrograms filters={filters} />
          </div>
        </div>
      )
    },
    {
      id: "applications",
      label: t('tabs.applications'),
      icon: <Calendar className="h-4 w-4" />,
      content: <MyApplications />
    },
    {
      id: "saved",
      label: t('tabs.saved'),
      icon: <BookOpen className="h-4 w-4" />,
      content: <SavedPrograms />
    }
  ];

  return (
    <EducationPathwayLayout
      title={t('title')}
      description={t('description')}
      icon={<University className="h-12 w-12 text-blue-600" />}
      stats={educationStats}
      tabs={educationTabs}
      defaultTab="all-programs"
      actionButtonText={t('buttons.explorePrograms')}
      actionButtonHref="#all-programs"
      academicYear={t('academicYear')}
    />
  );
};

export default UniversityProgramsPage;


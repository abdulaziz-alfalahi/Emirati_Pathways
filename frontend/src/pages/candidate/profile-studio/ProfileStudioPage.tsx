import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProfileStudioLayout } from './ProfileStudioLayout';
import { IdentityModule } from '@/components/profile-studio/modules/IdentityModule';
import { ExperienceModule } from '@/components/profile-studio/modules/ExperienceModule';
import { EducationModule } from '@/components/profile-studio/modules/EducationModule';
import { SkillsModule } from '@/components/profile-studio/modules/SkillsModule';
import { CareerCompassModule } from '@/components/profile-studio/modules/CareerCompassModule';
import { CVPreviewModule } from '@/components/profile-studio/modules/CVPreviewModule';
import { CandidateAssessmentHub } from '@/components/profile-studio/modules/CandidateAssessmentHub';

export const ProfileStudioPage = () => {
    return (
        <ProfileStudioLayout>
            <Routes>
                <Route path="/" element={<Navigate to="identity" replace />} />
                <Route path="identity" element={<IdentityModule />} />
                <Route path="experience" element={<ExperienceModule />} />
                <Route path="education" element={<EducationModule />} />
                <Route path="skills" element={<SkillsModule />} />
                <Route path="compass" element={<CareerCompassModule />} />
                <Route path="preview" element={<CVPreviewModule />} />
                <Route path="assessment-centers" element={<CandidateAssessmentHub />} />
            </Routes>
        </ProfileStudioLayout>
    );
};

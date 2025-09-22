
export function createCredentialFromVerification(verificationType: string, data: any, verificationResult: any) {
  switch (verificationType) {
    case 'education':
      return {
        institution_name: data.institution_name,
        credential_title: `${data.degree_type} in ${data.field_of_study}`,
        issue_date: `${data.graduation_year}-01-01`
      };
    case 'employment':
      return {
        institution_name: data.employer_name,
        credential_title: data.job_title,
        issue_date: data.start_date
      };
    case 'certification':
      return {
        institution_name: data.issuing_organization,
        credential_title: data.certification_name,
        issue_date: data.issue_date
      };
    default:
      throw new Error('Invalid verification type');
  }
}

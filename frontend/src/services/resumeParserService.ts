
// Export everything from the new modular structure
export * from './resume/parseService';
export * from './resume/storageService';
export * from './resume/utils';
export * from './resume/affindaClient';
export * from './resume/apiKeyService';
export * from './resume/dataMappers';

// Re-export the getResumeData function for clarity
export { getResumeData } from './resume/storageService';

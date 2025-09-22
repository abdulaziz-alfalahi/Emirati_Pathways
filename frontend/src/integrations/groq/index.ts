// --- INTERFACES (Keep these the same) ---
export interface PersonalInfo { fullName?: string; email?: string; phone?: string; address?: string; summary?: string; linkedIn?: string; website?: string; }
export interface Experience { id?: string; position?: string; company?: string; location?: string; startDate?: string; endDate?: string; description?: string; }
export interface Education { id?: string; institution?: string; degree?: string; fieldOfStudy?: string; startDate?: string; endDate?: string; }
export interface Skills { technical?: string[]; soft?: string[]; }
export interface Language { id?: string; language?: string; proficiency?: string; }
export interface Certification { id?: string; name?: string; issuingOrganization?: string; date?: string; }
export interface Project { id?: string; name?: string; description?: string; url?: string; }
export interface CVData { personalInfo: PersonalInfo; experience: Experience[]; education: Education[]; skills: Skills; languages: Language[]; certifications: Certification[]; projects: Project[]; }

// --- API CLIENT FOR YOUR CURRENT FLASK SERVER ---
const API_BASE_URL = 'http://localhost:5001';

export async function parseCV(file: File): Promise<CVData> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        console.log("🚀 Sending CV to current Flask API server for parsing...");
        console.log(`📄 Using endpoint: ${API_BASE_URL}/api/cv/parse`);
        
        const response = await fetch(`${API_BASE_URL}/api/cv/parse`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
        }

        const responseData = await response.json();
        console.log("✅ API parsing successful:", responseData);
        
        // Extract data from the unified response format
        const data: CVData = responseData.data || responseData;
        
        console.log("📊 Extracted CV data:", {
            name: data.personalInfo?.fullName || 'Unknown',
            email: data.personalInfo?.email || 'No email',
            phone: data.personalInfo?.phone || 'No phone',
            experienceCount: data.experience?.length || 0,
            educationCount: data.education?.length || 0,
            technicalSkills: data.skills?.technical?.length || 0,
            softSkills: data.skills?.soft?.length || 0
        });
        
        return data;

    } catch (error) {
        console.error("❌ Failed to call the parsing API:", error);
        return {
            personalInfo: {
                fullName: "API Call Failed",
                summary: error instanceof Error ? error.message : "Could not connect to the parsing server.",
            },
            experience: [], 
            education: [], 
            skills: { technical: [], soft: [] }, 
            languages: [], 
            certifications: [], 
            projects: []
        };
    }
}

// --- Keep all other exports for compatibility ---
export async function testGroqConnection(): Promise<{ success: boolean; message: string }> {
    try {
        console.log("🔍 Testing connection to Flask API server...");
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log("✅ Health check successful:", data);
            return { success: true, message: "Flask API server is running and healthy" };
        } else {
            console.log("❌ Health check failed:", response.status);
            return { success: false, message: `Flask API server responded with status ${response.status}` };
        }
    } catch (error) {
        console.error("❌ Connection test failed:", error);
        return { success: false, message: "Cannot connect to Flask API server" };
    }
}

function useMockMutation(mutationFn: (...args: any[]) => Promise<any>) { return { mutateAsync: async (...args: any[]) => { try { return await mutationFn(...args); } catch (error) { throw error; } }, isPending: false, isLoading: false, error: null, }; }
export function useCareerAdvice() { const generateAdvice = async (prompt: string) => { return { advice: `This is AI advice for: "${prompt}"` }; }; return useMockMutation(generateAdvice); }
export function useConversationHistory() { return { conversations: [], addConversation: (conv: any) => console.log("Adding conversation:", conv), clearHistory: () => console.log("Clearing history"), }; }
export function useGroqConfig() { return { config: { apiKey: "API_HANDLED_BY_SERVER" }, updateConfig: (newConfig: any) => console.log("Config handled by server"), isConfigured: true, }; }
export async function generateCVSuggestions(cvData: CVData) { console.log("Generating CV suggestions for:", cvData.personalInfo.fullName); return [{ field: "summary", suggestion: "Make the summary more impactful." }]; }
export async function improveContent(content: string, field: string) { return `Improved ${field}: ${content}`; }
export async function scoreCVComprehensively(cvData: CVData) { return { overallScore: 85, feedback: "Great CV!", sections: { personalInfo: { score: 90, feedback: "Excellent summary." }, experience: { score: 88, feedback: "Strong experience." }, education: { score: 80, feedback: "Good educational background." }, skills: { score: 82, feedback: "Relevant skills listed." }, } }; }


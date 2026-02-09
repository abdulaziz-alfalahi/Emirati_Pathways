
const fs = require('fs');
const path = require('path');

// 1. Read the dumped JSON
const jsonPath = path.join(__dirname, '..', 'backend', 'cv_dump.json');
let rawData;
try {
    rawData = fs.readFileSync(jsonPath, 'utf8');
    // Remove potential non-json output at start if any (but Python output seemed clean aside from logs which went to stderr?)
    // Actually, execution output in Cortex goes to stdout. My run_command output showed logs.
    // Let's assume the file captured stdout which contains the JSON.
    // I need to filter out lines that are not JSON.
    const lines = rawData.split('\n');
    const jsonLines = lines.filter(l => l.trim().startsWith('{') || l.trim().startsWith('}') || l.trim().startsWith('"') || l.trim().startsWith('[') || l.trim().startsWith(']') || l.trim().startsWith(' ') || l.trim() === '');
    const cleanJson = jsonLines.join('\n');
    // Find the first { and last }
    const firstBrace = rawData.indexOf('{');
    const lastBrace = rawData.lastIndexOf('}');
    if (firstBrace === -1) throw new Error("No JSON found");
    const jsonStr = rawData.substring(firstBrace, lastBrace + 1);

    rawData = JSON.parse(jsonStr);
} catch (e) {
    console.error("Failed to parse JSON dump:", e);
    // Print first few chars to debug
    if (rawData) console.log("Start of file:", rawData.substring(0, 100));
    process.exit(1);
}

// 2. Mock the CVProfile.tsx transform function
const transformCVData = (data) => {
    console.log("Input Keys:", Object.keys(data));

    // Handle both camelCase and snake_case field names
    const personalInfo = data.personalInfo || data.personal_info || {};
    console.log("PersonalInfo Keys:", Object.keys(personalInfo));

    const experience = data.experience || data.work_experience || [];
    const education = data.education || [];
    const skills = data.skills || data.technicalSkills || data.technical_skills || [];
    const softSkills = data.softSkills || data.soft_skills || [];
    const languages = data.languages || [];
    const certifications = data.certifications || [];
    const professionalSummary = data.professionalSummary || data.professional_summary || personalInfo.summary || '';

    // Combine technical and soft skills (Simplified for debug)
    let allSkills = [];
    if (Array.isArray(skills)) allSkills = [...skills];
    if (Array.isArray(softSkills)) allSkills = [...allSkills, ...softSkills];

    const result = {
        id: data.id,
        personalInfo: {
            fullName: personalInfo.fullName || personalInfo.full_name, // Removed complex logic for debug
            firstName: personalInfo.firstName || personalInfo.first_name,
            lastName: personalInfo.lastName || personalInfo.last_name,
            email: personalInfo.email,
            phone: personalInfo.phone,
            location: personalInfo.location,
            nationality: personalInfo.nationality,
            linkedIn: personalInfo.linkedIn || personalInfo.linkedin,
            portfolio: personalInfo.portfolio || personalInfo.website,
            summary: professionalSummary || personalInfo.summary,
        },
        experience: experience,
        education: education,
        skills: allSkills
    };

    return result;
};

// 3. Simulate the Data Extraction from Response
// In CVProfile.tsx: const actualData = cvResult.data.data || cvResult.data;
// Our dump IS the cvResult (the response body).
const cvResult = rawData;
// Check structure
console.log("cvResult Keys:", Object.keys(cvResult));

if (cvResult.data) {
    console.log("cvResult.data exists. Type:", typeof cvResult.data);
    // In Python get_cv: 'data': json.loads(cv_record['parsed_data'])  <-- This IS A DICTIONARY

    // Logic:
    // const actualData = cvResult.data.data || cvResult.data;

    let actualData = cvResult.data; // This is the dictionary { personal_info: ... }

    // Wait, if cvResult.data has a property 'data', uses that. Does it?
    if (actualData && actualData.data) {
        console.log("Using cvResult.data.data");
        actualData = actualData.data;
    } else {
        console.log("Using cvResult.data itself");
    }

    // Run Transform
    const transformed = transformCVData(actualData);
    console.log("\n=== Transformed Output ===");
    console.log(JSON.stringify(transformed, null, 2));

} else {
    console.error("cvResult.data is missing!");
}

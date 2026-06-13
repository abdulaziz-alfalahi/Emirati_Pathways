
import { supabase } from "@/integrations/supabase/client";
import { Certificate, Portfolio, PortfolioHighlight, Training } from "@/types/portfolio";
import { fetchUserAssessmentSessions } from "./assessments/sessionService";
import { fetchAdvisorySessions } from "./careerAdvisory/advisorySessionService";

// Mock data for development until Supabase tables are created
const mockCertificates: Certificate[] = [
  {
    id: "1",
    user_id: "user123",
    title: "AWS Solutions Architect",
    issuer: "Amazon Web Services",
    issue_date: "2023-01-15",
    expiry_date: "2026-01-15",
    credential_id: "AWS-123-456",
    credential_url: "https://aws.amazon.com/verification",
    description: "Professional level certification for AWS architecture",
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

const mockTrainings: Training[] = [
  {
    id: "1",
    user_id: "user123",
    title: "Full Stack Web Development",
    provider: "Udemy",
    start_date: "2022-09-01",
    end_date: "2022-12-15",
    is_completed: true,
    skills_gained: ["JavaScript", "React", "Node.js", "MongoDB"],
    description: "Comprehensive course on modern web development",
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

const mockHighlights: PortfolioHighlight[] = [
  {
    id: "1",
    user_id: "user123",
    title: "Career Services Platform",
    description: "Developed a comprehensive career services platform for educational institutions",
    type: "project",
    date: "2023-05-20",
    url: "https://example.com/project",
    created_at: new Date().toISOString(),
    updated_at: null
  }
];

// Fetch certificates for a specific user
export const fetchCertificates = async (userId: string): Promise<Certificate[]> => {
  try {
    // Return mock data for now
    return [...mockCertificates];
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", userId)
      .order("issue_date", { ascending: false });

    if (error) {
      console.error("Error fetching certificates:", error);
      throw error;
    }

    return data as Certificate[];
    */
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return [];
  }
};

// Fetch training records for a specific user
export const fetchTrainings = async (userId: string): Promise<Training[]> => {
  try {
    // Return mock data for now
    return [...mockTrainings];
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("trainings")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching trainings:", error);
      throw error;
    }

    return data as Training[];
    */
  } catch (error) {
    console.error("Error fetching trainings:", error);
    return [];
  }
};

// Fetch portfolio highlights for a specific user
export const fetchPortfolioHighlights = async (userId: string): Promise<PortfolioHighlight[]> => {
  try {
    // Return mock data for now
    return [...mockHighlights];
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("portfolio_highlights")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching portfolio highlights:", error);
      throw error;
    }

    return data as PortfolioHighlight[];
    */
  } catch (error) {
    console.error("Error fetching portfolio highlights:", error);
    return [];
  }
};

// Add a new certificate
export const addCertificate = async (certificate: Omit<Certificate, "id" | "created_at" | "updated_at">): Promise<Certificate> => {
  try {
    // Mock implementation for now
    const newCert: Certificate = {
      ...certificate,
      id: `cert-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    mockCertificates.push(newCert);
    return newCert;
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("certificates")
      .insert(certificate)
      .select()
      .single();

    if (error) {
      console.error("Error adding certificate:", error);
      throw error;
    }

    return data as Certificate;
    */
  } catch (error) {
    console.error("Error adding certificate:", error);
    throw error;
  }
};

// Add a new training record
export const addTraining = async (training: Omit<Training, "id" | "created_at" | "updated_at">): Promise<Training> => {
  try {
    // Mock implementation for now
    const newTraining: Training = {
      ...training,
      id: `train-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    mockTrainings.push(newTraining);
    return newTraining;
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("trainings")
      .insert(training)
      .select()
      .single();

    if (error) {
      console.error("Error adding training:", error);
      throw error;
    }

    return data as Training;
    */
  } catch (error) {
    console.error("Error adding training:", error);
    throw error;
  }
};

// Add a new portfolio highlight
export const addPortfolioHighlight = async (highlight: Omit<PortfolioHighlight, "id" | "created_at" | "updated_at">): Promise<PortfolioHighlight> => {
  try {
    // Mock implementation for now
    const newHighlight: PortfolioHighlight = {
      ...highlight,
      id: `highlight-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: null
    };
    
    mockHighlights.push(newHighlight);
    return newHighlight;
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("portfolio_highlights")
      .insert(highlight)
      .select()
      .single();

    if (error) {
      console.error("Error adding portfolio highlight:", error);
      throw error;
    }

    return data as PortfolioHighlight;
    */
  } catch (error) {
    console.error("Error adding portfolio highlight:", error);
    throw error;
  }
};

// Update a certificate
export const updateCertificate = async (id: string, certificate: Partial<Omit<Certificate, "id" | "created_at" | "updated_at">>): Promise<Certificate> => {
  try {
    // Mock implementation for now
    const index = mockCertificates.findIndex(cert => cert.id === id);
    if (index === -1) {
      throw new Error("Certificate not found");
    }
    
    mockCertificates[index] = {
      ...mockCertificates[index],
      ...certificate,
      updated_at: new Date().toISOString()
    };
    
    return mockCertificates[index];
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("certificates")
      .update({
        ...certificate,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating certificate:", error);
      throw error;
    }

    return data as Certificate;
    */
  } catch (error) {
    console.error("Error updating certificate:", error);
    throw error;
  }
};

// Update a training record
export const updateTraining = async (id: string, training: Partial<Omit<Training, "id" | "created_at" | "updated_at">>): Promise<Training> => {
  try {
    // Mock implementation for now
    const index = mockTrainings.findIndex(train => train.id === id);
    if (index === -1) {
      throw new Error("Training not found");
    }
    
    mockTrainings[index] = {
      ...mockTrainings[index],
      ...training,
      updated_at: new Date().toISOString()
    };
    
    return mockTrainings[index];
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("trainings")
      .update({
        ...training,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating training:", error);
      throw error;
    }

    return data as Training;
    */
  } catch (error) {
    console.error("Error updating training:", error);
    throw error;
  }
};

// Update a portfolio highlight
export const updatePortfolioHighlight = async (id: string, highlight: Partial<Omit<PortfolioHighlight, "id" | "created_at" | "updated_at">>): Promise<PortfolioHighlight> => {
  try {
    // Mock implementation for now
    const index = mockHighlights.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error("Highlight not found");
    }
    
    mockHighlights[index] = {
      ...mockHighlights[index],
      ...highlight,
      updated_at: new Date().toISOString()
    };
    
    return mockHighlights[index];
    
    // Uncomment when Supabase table is ready
    /*
    const { data, error } = await supabase
      .from("portfolio_highlights")
      .update({
        ...highlight,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating portfolio highlight:", error);
      throw error;
    }

    return data as PortfolioHighlight;
    */
  } catch (error) {
    console.error("Error updating portfolio highlight:", error);
    throw error;
  }
};

// Delete a certificate
export const deleteCertificate = async (id: string): Promise<void> => {
  try {
    // Mock implementation for now
    const index = mockCertificates.findIndex(cert => cert.id === id);
    if (index !== -1) {
      mockCertificates.splice(index, 1);
    }
    
    // Uncomment when Supabase table is ready
    /*
    const { error } = await supabase
      .from("certificates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting certificate:", error);
      throw error;
    }
    */
  } catch (error) {
    console.error("Error deleting certificate:", error);
    throw error;
  }
};

// Delete a training record
export const deleteTraining = async (id: string): Promise<void> => {
  try {
    // Mock implementation for now
    const index = mockTrainings.findIndex(train => train.id === id);
    if (index !== -1) {
      mockTrainings.splice(index, 1);
    }
    
    // Uncomment when Supabase table is ready
    /*
    const { error } = await supabase
      .from("trainings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting training:", error);
      throw error;
    }
    */
  } catch (error) {
    console.error("Error deleting training:", error);
    throw error;
  }
};

// Delete a portfolio highlight
export const deletePortfolioHighlight = async (id: string): Promise<void> => {
  try {
    // Mock implementation for now
    const index = mockHighlights.findIndex(item => item.id === id);
    if (index !== -1) {
      mockHighlights.splice(index, 1);
    }
    
    // Uncomment when Supabase table is ready
    /*
    const { error } = await supabase
      .from("portfolio_highlights")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting portfolio highlight:", error);
      throw error;
    }
    */
  } catch (error) {
    console.error("Error deleting portfolio highlight:", error);
    throw error;
  }
};

// Fetch all portfolio data for a user
export const fetchPortfolio = async (userId: string): Promise<Portfolio> => {
  try {
    // Parallel fetching of all portfolio components
    const [certificates, trainings, highlights, assessments, interviews] = await Promise.all([
      fetchCertificates(userId),
      fetchTrainings(userId),
      fetchPortfolioHighlights(userId),
      fetchUserAssessmentSessions(userId),
      fetchAdvisorySessions(userId),
    ]);

    // Filter interviews from advisory sessions
    const interviewSessions = interviews.filter((session) => session.is_interview);

    return {
      userId,
      certificates,
      trainings,
      highlights,
      assessments,
      interviews: interviewSessions,
    };
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    throw error;
  }
};

// Check if a user can view another user's portfolio
export const canViewPortfolio = async (viewerId: string, portfolioOwnerId: string): Promise<boolean> => {
  // Check if viewer is the owner
  if (viewerId === portfolioOwnerId) return true;
  
  try {
    // Mock implementation for now - always allow for development
    return true;
    
    // Uncomment when Supabase table is ready
    /*
    // Check if viewer has a role that allows them to view portfolios
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", viewerId);

    if (error) {
      console.error("Error checking user roles:", error);
      return false;
    }

    // Check if viewer has one of the authorized roles
    const authorizedRoles = ["career_advisor", 'admin', "private_sector_recruiter", "mentor"];
    return data.some(roleObj => authorizedRoles.includes(roleObj.role));
    */
  } catch (error) {
    console.error("Error checking portfolio permissions:", error);
    return false;
  }
};

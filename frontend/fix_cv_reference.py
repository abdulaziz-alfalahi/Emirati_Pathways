
import os

target_file = r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src\pages\cv-builder\AutoFillCVBuilder.tsx'

with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old code block (we use a robust substring match)
old_code_start = 'const handleDeleteCV = async (id: string, e?: React.MouseEvent) => {'
old_code_end_snippet = 'alert(\'Failed to delete CV\');\n    }\n  };'

# We will try to find the start index
start_idx = content.find(old_code_start)

if start_idx == -1:
    print("Could not find handleDeleteCV start.")
    # Fallback: maybe it's formatted slightly differently, let's look for just the signature
    old_code_start = 'const handleDeleteCV = async (id: string, e?: React.MouseEvent) =>'
    start_idx = content.find(old_code_start)

if start_idx == -1:
    print("Error: Could not find handleDeleteCV function.")
    exit(1)

# Find the end of the matching block (counting braces is better but let's try a simpler approach first: finding the end of the function)
# The function ends with "  };" after the catch block.
# Let's verify by finding the next "const handleExportPDF" which comes after it.
next_func = 'const handleExportPDF'
end_idx = content.find(next_func, start_idx)

if end_idx == -1:
    print("Error: Could not find handleExportPDF function to delimit the block.")
    exit(1)

# The replace block is content[start_idx:end_idx] minus the whitespace before handleExportPDF
# Careful with newlines.
block_to_replace = content[start_idx:end_idx].strip()

# New code to insert
new_code = """  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const handleDeleteTrigger = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDeleteConfirmationId(id);
  };

  const confirmDeleteCV = async () => {
    if (!deleteConfirmationId) return;

    const id = deleteConfirmationId;
    
    try {
      const result = await cvStorageService.deleteCV(id);
      if (result.success) {
        setSavedCVs(prev => prev.filter(cv => cv.id !== id));
        if (currentCVId === id) { 
           setCurrentCVId(null); 
           setCvTitle('My CV'); 
           setFormData({
            personalInfo: { firstName: '', lastName: '', email: '', phone: '', location: '', nationality: 'UAE' },
            professionalSummary: '',
            technicalSkills: [],
            softSkills: [],
            experience: [],
            education: []
           });
           setCurrentStep('upload');
        }
      } else { 
        alert(result.message); 
      }
    } catch (error) { 
      console.error('Delete error:', error); 
      alert('Failed to delete CV'); 
    } finally {
      setDeleteConfirmationId(null);
    }
  };

"""

# Perform replacement
# content[start_idx:end_idx] includes the old function and some trailing newlines usually.
# We want to replace everything from start_idx up to end_idx (exclusive) with new_code.
# But we need to check if there is extra whitespace.

# Let's just slice it.
new_content = content[:start_idx] + new_code + '\n  ' + content[end_idx:]

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully replaced handleDeleteCV with new logic.")

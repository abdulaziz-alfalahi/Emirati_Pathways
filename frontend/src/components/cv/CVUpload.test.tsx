import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CVUploadComponent from './CVUploadComponent';
import CVAnalysisResults from './CVAnalysisResults';
import userEvent from '@testing-library/user-event';

// Radix TabsTrigger activates on pointer/mousedown, not on a bare synthetic click,
// so fireEvent.click() leaves the panel unmounted. userEvent fires the full sequence.
const selectTab = async (name: string) => {
  await userEvent.click(screen.getByRole('tab', { name }));
};

// Mock API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      cv_id: 'cv_test_id_123',
      data: { experience: [{ position: 'Developer' }], skills: [{ name: 'React' }] },
      analysis: { cv_score: 85 },
      job_matches: [{ job_id: 'job_1', title: 'React Developer' }],
      profile_completion: 90
    }),
  })
) as ReturnType<typeof vi.fn>;

describe('CVUploadComponent', () => {
  const onUploadSuccess = vi.fn();
  const onUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders correctly with file upload and text input tabs', () => {
    render(<CVUploadComponent />);
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText('Text Input')).toBeInTheDocument();
    expect(screen.getByText('Drop your CV here or click to browse')).toBeInTheDocument();
  });

  test('handles file upload via drag and drop', async () => {
    render(<CVUploadComponent onUploadSuccess={onUploadSuccess} />);
    const dropzone = screen.getByText('Drop your CV here or click to browse').closest('div');
    
    const file = new File(['(⌐□_□)'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = {
      files: [file],
      items: [{
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      }],
      types: ['Files'],
    };

    fireEvent.dragOver(dropzone, {});
    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText(/CV processed successfully!/)).toBeInTheDocument();
      expect(onUploadSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('handles file upload via file input', async () => {
    render(<CVUploadComponent onUploadSuccess={onUploadSuccess} />);
    const fileInput = screen.getByText('Choose Files').closest('button').nextElementSibling;
    
    const file = new File(['(⌐□_□)'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText(/CV processed successfully!/)).toBeInTheDocument();
      expect(onUploadSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('validates file size', async () => {
    render(<CVUploadComponent maxFileSize={100} onUploadError={onUploadError} />);
    const dropzone = screen.getByText('Drop your CV here or click to browse').closest('div');
    
    const file = new File(['a'.repeat(200)], 'large.pdf', { type: 'application/pdf' });
    const dataTransfer = { files: [file] };

    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByText(/File size .* exceeds maximum allowed size/)).toBeInTheDocument();
      expect(onUploadError).not.toHaveBeenCalled(); // Error is displayed in UI, not via prop
    });
  });

  test('validates file type', async () => {
    render(<CVUploadComponent allowedTypes={['pdf']} onUploadError={onUploadError} />);
    const dropzone = screen.getByText('Drop your CV here or click to browse').closest('div');
    
    const file = new File(['(⌐□_□)'], 'test.txt', { type: 'text/plain' });
    const dataTransfer = { files: [file] };

    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByText(/File type .txt not supported/)).toBeInTheDocument();
    });
  });

  test('handles text input upload', async () => {
    render(<CVUploadComponent onUploadSuccess={onUploadSuccess} />);
    await selectTab('Text Input');

    const textarea = screen.getByPlaceholderText('Copy and paste your CV content here...');
    fireEvent.change(textarea, { target: { value: 'This is a test CV with enough content to be valid.' } });

    const parseButton = screen.getByText('Parse CV Text');
    fireEvent.click(parseButton);

    await waitFor(() => {
      expect(onUploadSuccess).toHaveBeenCalledTimes(1);
      expect(textarea.value).toBe(''); // Textarea should be cleared on success
    });
  });

  test('disables text upload button for short text', async () => {
    render(<CVUploadComponent />);
    await selectTab('Text Input');

    const textarea = screen.getByPlaceholderText('Copy and paste your CV content here...');
    fireEvent.change(textarea, { target: { value: 'short' } });

    const parseButton = screen.getByText('Parse CV Text');
    expect(parseButton).toBeDisabled();
  });

  test('removes an uploaded file from the list', async () => {
    render(<CVUploadComponent />);
    const dropzone = screen.getByText('Drop your CV here or click to browse').closest('div');
    
    const file = new File(['(⌐□_□)'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = { files: [file] };

    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  test('handles upload error from API', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Server error' }),
      })
    );

    render(<CVUploadComponent onUploadError={onUploadError} />);
    const dropzone = screen.getByText('Drop your CV here or click to browse').closest('div');
    
    const file = new File(['(⌐□_□)'], 'error.pdf', { type: 'application/pdf' });
    const dataTransfer = { files: [file] };

    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
      expect(onUploadError).toHaveBeenCalledWith('Server error');
    });
  });
});

describe('CVAnalysisResults', () => {
  const mockCvData = {
    success: true,
    data: {
      personal_info: { full_name: 'Test User', email: 'test@example.com' },
      experience: [{ position: 'Developer', company: 'Test Inc.' }],
      education: [{ degree: 'BSc Computer Science', institution: 'Test University' }],
      skills: [{ name: 'React', category: 'Technical' }],
      languages: [{ language: 'English', proficiency: 'Native' }],
      uae_analysis: { uae_experience_years: 2, has_uae_education: true }
    },
    analysis: {
      cv_score: 85,
      strengths: ['Good experience'],
      improvement_areas: ['Add more skills']
    },
    metadata: { parsed_at: new Date().toISOString() }
  };

  test('renders all tabs and main sections', () => {
    render(<CVAnalysisResults cvData={mockCvData} />);
    expect(screen.getByText('CV Analysis Results')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Analysis')).toBeInTheDocument();
  });

  test('displays personal information in overview tab', async () => {
    render(<CVAnalysisResults cvData={mockCvData} />);
    await selectTab('Overview');
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('displays experience details in experience tab', async () => {
    render(<CVAnalysisResults cvData={mockCvData} />);
    await selectTab('Experience');
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Test Inc.')).toBeInTheDocument();
  });

  test('displays analysis details in analysis tab', async () => {
    render(<CVAnalysisResults cvData={mockCvData} />);
    await selectTab('Analysis');
    expect(screen.getByText('Overall CV Score')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('Good experience')).toBeInTheDocument();
    expect(screen.getByText('Add more skills')).toBeInTheDocument();
  });

  test('renders error message for failed CV data', () => {
    render(<CVAnalysisResults cvData={{ success: false }} />);
    expect(screen.getByText('No CV data available or parsing failed.')).toBeInTheDocument();
  });
});

export const parseResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);

  try {
    const response = await fetch('http://localhost:3000/api/parse/resume', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error?.message || 'Failed to parse resume');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

'use client';

import { useState } from 'react';
import { usePersonnelManagement } from '@/hooks/usePersonnelManagement';
import { PersonnelFormData } from '@/types/admin';

export default function BulkUpload() {
  const { addPersonnelBulk, isLoading, message, clearMessage } = usePersonnelManagement();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        const lines = text.split('\\n').slice(1); // Skip header
        const personnel: PersonnelFormData[] = lines.map((line) => {
          const [militaryPersonalNumber, firstName, lastName, rank, phoneNumber] = line.split(',');
          return { militaryPersonalNumber, firstName, lastName, rank, phoneNumber };
        });
        await addPersonnelBulk(personnel);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Bulk Upload</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || isLoading}>
        {isLoading ? 'Uploading...' : 'Upload CSV'}
      </button>
      {message && (
        <div>
          <p>{message.text}</p>
          <button onClick={clearMessage}>Clear</button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { AdminFirestoreService } from '@/lib/adminUtils';
import { AuthorizedPersonnelData } from '@/types/admin';
import { UserType } from '@/types/user';

interface CsvUploadResult {
  success: number;
  failed: number;
  errors: string[];
  successNames: string[];
}

export default function BulkUpload() {
  const [uploadResult, setUploadResult] = useState<CsvUploadResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvPreview, setCsvPreview] = useState<AuthorizedPersonnelData[] | null>(null);
  const [processingProgress, setProcessingProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvTemplate = `militaryPersonalNumber,firstName,lastName,rank,phoneNumber,userType
1234567,"מתן","טל","רס״ל","0501234567","user"
2345678,"אברהם","כהן","סמל","0527654321","team_leader"
3456789,"דוד","לוי","רב״ט","0546789012","manager"`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'authorized_personnel_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvFile = (file: File): Promise<AuthorizedPersonnelData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have header and at least one data row'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const expectedHeaders = ['militaryPersonalNumber', 'firstName', 'lastName', 'rank', 'phoneNumber', 'userType'];
          
          // Validate headers
          const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }

          const personnel: AuthorizedPersonnelData[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            if (values.length !== headers.length) {
              reject(new Error(`Row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`));
              return;
            }

            const person: AuthorizedPersonnelData = {
              militaryPersonalNumber: '',
              firstName: '',
              lastName: '',
              rank: '',
              phoneNumber: '',
              userType: UserType.USER // Default value
            };

            headers.forEach((header, index) => {
              if (expectedHeaders.includes(header)) {
                switch (header) {
                  case 'militaryPersonalNumber':
                    person.militaryPersonalNumber = values[index];
                    break;
                  case 'firstName':
                    person.firstName = values[index];
                    break;
                  case 'lastName':
                    person.lastName = values[index];
                    break;
                  case 'rank':
                    person.rank = values[index];
                    break;
                  case 'phoneNumber':
                    person.phoneNumber = values[index];
                    break;
                  case 'userType':
                    person.userType = (values[index] as UserType) || UserType.USER;
                    break;
                }
              }
            });

            personnel.push(person);
          }

          resolve(personnel);
        } catch (error) {
          reject(new Error(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadResult({
        success: 0,
        failed: 1,
        errors: ['Please select a CSV file'],
        successNames: []
      });
      return;
    }

    try {
      setIsProcessing(true);
      const personnel = await parseCsvFile(file);
      setCsvPreview(personnel);
      setUploadResult(null);
    } catch (error) {
      setUploadResult({
        success: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        successNames: []
      });
      setCsvPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const processBulkUpload = async () => {
    if (!csvPreview) return;

    setIsProcessing(true);
    setProcessingProgress('Checking for duplicates and validating data...');

    try {
      // Use the new bulk upload method
      const bulkResult = await AdminFirestoreService.addAuthorizedPersonnelBulk(csvPreview);
      
      const results: CsvUploadResult = {
        success: bulkResult.successful.length,
        failed: bulkResult.failed.length + bulkResult.duplicates.length,
        errors: [
          ...bulkResult.failed.map(f => `Row ${f.rowIndex}: ${f.error}`),
          ...bulkResult.duplicates.map(d => `Row ${d.rowIndex}: Military ID ${d.person.militaryPersonalNumber} already exists`)
        ],
        successNames: bulkResult.successful.map(s => `${s.person.firstName} ${s.person.lastName}`)
      };

      setUploadResult(results);
      
    } catch (error) {
      const results: CsvUploadResult = {
        success: 0,
        failed: csvPreview.length,
        errors: [`Bulk upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        successNames: []
      };
      setUploadResult(results);
    }

    setProcessingProgress('');
    setCsvPreview(null);
    setIsProcessing(false);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearResults = () => {
    setUploadResult(null);
    setCsvPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-4xl mr-4">📁</div>
          <div>
            <h2 className="text-2xl font-bold text-info-900 dark:text-info-100">
              Bulk Upload Personnel
            </h2>
            <p className="text-info-700 dark:text-info-300">
              Upload multiple authorized personnel via CSV file
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
          📋 <span className="mr-2"></span>Upload Instructions
        </h3>
        <div className="space-y-4">
          <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
            <h4 className="font-medium text-warning-900 dark:text-warning-100 mb-2">Required CSV Format:</h4>
            <div className="text-sm text-warning-800 dark:text-warning-200 space-y-1">
              <div>• <strong>Headers</strong>: militaryPersonalNumber, firstName, lastName, rank, phoneNumber, userType</div>
              <div>• <strong>No Email Required</strong>: CSV bulk upload is for military personnel data only</div>
              <div>• <strong>Encoding</strong>: UTF-8 (for Hebrew text support)</div>
              <div>• <strong>Phone Format</strong>: Israeli format (050xxxxxxx, +972xxxxxxxxx, or 5xxxxxxxx)</div>
              <div>• <strong>Military ID</strong>: 5-7 digits only</div>
                                  <div>• <strong>User Type</strong>: user, team_leader, manager, system_manager, admin (defaults to &apos;user&apos;)</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadTemplate}
              className="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-md
                         focus:ring-2 focus:ring-success-500 focus:ring-offset-2 transition-colors"
            >
              📥 Download CSV Template
            </button>
          </div>
        </div>

        {/* Workflow Explanation */}
        <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-info-900 dark:text-info-100 mb-2">📋 Two-Step Process:</h4>
          <div className="text-sm text-info-800 dark:text-info-200 space-y-2">
            <div><strong>Step 1 - CSV Bulk Upload:</strong> Add military personnel data (no email required)</div>
            <div><strong>Step 2 - User Registration:</strong> Personnel register with personal email + Firebase Auth</div>
            <div className="text-xs text-info-600 dark:text-info-300 mt-2">
              ℹ️ CSV upload creates authorized personnel records. Users then register separately with their personal email.
            </div>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
          📤 <span className="mr-2"></span>Upload CSV File
        </h3>
        
        <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="block w-full text-sm text-neutral-500 dark:text-neutral-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-info-50 file:text-info-700
                       hover:file:bg-info-100
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Upload a CSV file with authorized personnel data
          </p>
        </div>
      </div>

      {/* CSV Preview */}
      {csvPreview && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
            👀 <span className="mr-2"></span>Preview ({csvPreview.length} personnel)
          </h3>
          
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">
                    Military ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase">
                    User Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {csvPreview.slice(0, 5).map((person, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {person.militaryPersonalNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {person.firstName} {person.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {person.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      {person.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-100 text-info-800 dark:bg-info-800 dark:text-info-100">
                        {person.userType || UserType.USER}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {csvPreview.length > 5 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Showing first 5 rows. Total: {csvPreview.length} personnel
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={processBulkUpload}
              disabled={isProcessing}
              className="bg-info-600 hover:bg-info-700 disabled:bg-neutral-400 
                         text-white font-medium py-2 px-6 rounded-md
                         focus:ring-2 focus:ring-info-500 focus:ring-offset-2
                         disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                '✅ Process Upload'
              )}
            </button>
            
            <button
              onClick={clearResults}
              disabled={isProcessing}
              className="border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 
                         hover:bg-neutral-50 dark:hover:bg-neutral-700 px-4 py-2 rounded-md transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ❌ Cancel
            </button>
          </div>

          {/* Progress Display */}
          {isProcessing && processingProgress && (
            <div className="mt-4 bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-lg p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-info-600 mr-3"></div>
                <span className="text-sm text-info-800 dark:text-info-200">{processingProgress}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
            📊 <span className="mr-2"></span>Upload Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-success-50 dark:bg-success-900/20 p-4 rounded-lg border border-success-200 dark:border-success-800">
              <div className="text-2xl font-bold text-success-600 dark:text-success-400">{uploadResult.success}</div>
              <div className="text-sm text-success-600 dark:text-success-400">Successfully Added</div>
            </div>
            <div className="bg-danger-50 dark:bg-danger-900/20 p-4 rounded-lg border border-danger-200 dark:border-danger-800">
              <div className="text-2xl font-bold text-danger-600 dark:text-danger-400">{uploadResult.failed}</div>
              <div className="text-sm text-danger-600 dark:text-danger-400">Failed</div>
            </div>
          </div>

          {uploadResult.successNames.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-success-900 dark:text-success-100 mb-2">✅ Successfully Added:</h4>
              <div className="bg-success-50 dark:bg-success-900/20 p-3 rounded border border-success-200 dark:border-success-800">
                <div className="text-sm text-success-800 dark:text-success-200">
                  {uploadResult.successNames.join(', ')}
                </div>
              </div>
            </div>
          )}

          {uploadResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-danger-900 dark:text-danger-100 mb-2">❌ Errors:</h4>
              <div className="bg-danger-50 dark:bg-danger-900/20 p-3 rounded border border-danger-200 dark:border-danger-800">
                <div className="text-sm text-danger-800 dark:text-danger-200 space-y-1">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={clearResults}
            className="bg-info-600 hover:bg-info-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            🔄 Upload Another File
          </button>
        </div>
      )}

      {/* Current Message */}
      {/* The message state and display were removed from the original file,
          so this section will be removed as well. */}
    </div>
  );
} 
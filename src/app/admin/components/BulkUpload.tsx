'use client';

import { useState, useRef } from 'react';
import { AdminFirestoreService } from '@/lib/adminUtils';
import { AuthorizedPersonnelData } from '@/types/admin';
import { UserType } from '@/types/user';
import { TEXT_CONSTANTS } from '@/constants/text';

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
      <div className="bg-info-50 border border-info-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-4xl me-4">📁</div>
          <div>
            <h2 className="text-2xl font-bold text-info-900">
              {TEXT_CONSTANTS.ADMIN.BULK_TITLE}
            </h2>
            <p className="text-info-700">
              {TEXT_CONSTANTS.ADMIN.BULK_SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
          {TEXT_CONSTANTS.ADMIN.BULK_INSTRUCTIONS_TITLE}
        </h3>
        <div className="space-y-4">
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <h4 className="font-medium text-warning-900 mb-2">פורמט CSV נדרש:</h4>
            <div className="text-sm text-warning-800 space-y-1">
              <div>• <strong>כותרות</strong>: militaryPersonalNumber, firstName, lastName, rank, phoneNumber, userType</div>
              <div>• <strong>ללא דוא״ל</strong>: העלאה מרובה היא לנתוני כוח אדם בלבד</div>
              <div>• <strong>קידוד</strong>: UTF-8 (לתמיכה בעברית)</div>
              <div>• <strong>פורמט טלפון</strong>: ישראלי (050xxxxxxx, +972xxxxxxxxx או 5xxxxxxxx)</div>
              <div>• <strong>מספר אישי</strong>: 5–7 ספרות בלבד</div>
              <div>• <strong>סוג משתמש</strong>: user, team_leader, manager, system_manager, admin (ברירת מחדל: &apos;user&apos;)</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadTemplate}
              className="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-md
                         focus:ring-2 focus:ring-success-500 focus:ring-offset-2 transition-colors"
            >
              📥 הורד תבנית CSV
            </button>
          </div>
        </div>

        {/* Workflow Explanation */}
        <div className="bg-info-50 border border-info-200 rounded-lg p-4 mt-4">
          <h4 className="font-medium text-info-900 mb-2">📋 תהליך דו-שלבי:</h4>
          <div className="text-sm text-info-800 space-y-2">
            <div><strong>שלב 1 - העלאת CSV:</strong> הוספת נתוני כוח אדם (ללא דוא״ל)</div>
            <div><strong>שלב 2 - רישום משתמש:</strong> הכוח אדם נרשם עם דוא״ל אישי + Firebase Auth</div>
            <div className="text-xs text-info-600 mt-2">
              ℹ️ העלאת CSV יוצרת רשומות כוח אדם מורשה. הרישום מתבצע בנפרד עם דוא״ל אישי.
            </div>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
          {TEXT_CONSTANTS.ADMIN.BULK_UPLOAD_FILE_TITLE}
        </h3>

        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="block w-full text-sm text-neutral-500
                       file:me-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-info-50 file:text-info-700
                       hover:file:bg-info-100
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-neutral-500 mt-2">
            העלה קובץ CSV עם נתוני כוח אדם מורשה
          </p>
        </div>
      </div>

      {/* CSV Preview */}
      {csvPreview && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            {TEXT_CONSTANTS.ADMIN.BULK_PREVIEW_TITLE} ({csvPreview.length} {TEXT_CONSTANTS.ADMIN.BULK_PERSONNEL_UNIT})
          </h3>
          
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase">
                    {TEXT_CONSTANTS.ADMIN.BULK_TABLE_MILITARY_ID}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase">
                    {TEXT_CONSTANTS.ADMIN.BULK_TABLE_NAME}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase">
                    {TEXT_CONSTANTS.ADMIN.BULK_TABLE_RANK}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase">
                    {TEXT_CONSTANTS.ADMIN.BULK_TABLE_PHONE}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-neutral-500 uppercase">
                    {TEXT_CONSTANTS.ADMIN.BULK_TABLE_USER_TYPE}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {csvPreview.slice(0, 5).map((person, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {person.militaryPersonalNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {person.firstName} {person.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {person.rank}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {person.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-100 text-info-800">
                        {person.userType || UserType.USER}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {csvPreview.length > 5 && (
            <p className="text-sm text-neutral-500 mb-4">
              {TEXT_CONSTANTS.ADMIN.BULK_SHOWING_FIRST} {csvPreview.length} {TEXT_CONSTANTS.ADMIN.BULK_PERSONNEL_UNIT}
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2"></div>
                  {TEXT_CONSTANTS.ADMIN.BULK_PROCESSING}
                </div>
              ) : (
                TEXT_CONSTANTS.ADMIN.BULK_PROCESS
              )}
            </button>
            
            <button
              onClick={clearResults}
              disabled={isProcessing}
              className="border border-neutral-300 text-neutral-700 
                         hover:bg-neutral-50 px-4 py-2 rounded-md transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {TEXT_CONSTANTS.ADMIN.BULK_CANCEL}
            </button>
          </div>

          {/* Progress Display */}
          {isProcessing && processingProgress && (
            <div className="mt-4 bg-info-50 border border-info-200 rounded-lg p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-info-600 me-3"></div>
                <span className="text-sm text-info-800">{processingProgress}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            {TEXT_CONSTANTS.ADMIN.BULK_RESULTS_TITLE}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-success-50 p-4 rounded-lg border border-success-200">
              <div className="text-2xl font-bold text-success-600">{uploadResult.success}</div>
              <div className="text-sm text-success-600">{TEXT_CONSTANTS.ADMIN.BULK_SUCCESS_ADDED}</div>
            </div>
            <div className="bg-danger-50 p-4 rounded-lg border border-danger-200">
              <div className="text-2xl font-bold text-danger-600">{uploadResult.failed}</div>
              <div className="text-sm text-danger-600">{TEXT_CONSTANTS.ADMIN.BULK_FAILED}</div>
            </div>
          </div>

          {uploadResult.successNames.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-success-900 mb-2">{TEXT_CONSTANTS.ADMIN.BULK_SUCCESS_LIST}</h4>
              <div className="bg-success-50 p-3 rounded border border-success-200">
                <div className="text-sm text-success-800">
                  {uploadResult.successNames.join(', ')}
                </div>
              </div>
            </div>
          )}

          {uploadResult.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-danger-900 mb-2">{TEXT_CONSTANTS.ADMIN.BULK_ERRORS_LIST}</h4>
              <div className="bg-danger-50 p-3 rounded border border-danger-200">
                <div className="text-sm text-danger-800 space-y-1">
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
            {TEXT_CONSTANTS.ADMIN.BULK_UPLOAD_ANOTHER}
          </button>
        </div>
      )}

      {/* Current Message */}
      {/* The message state and display were removed from the original file,
          so this section will be removed as well. */}
    </div>
  );
} 
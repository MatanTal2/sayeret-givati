import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    console.log('🔍 API route called');
    
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('📋 Sheet ID:', sheetId ? 'Present' : 'Missing');
    console.log('🔑 Service Account:', serviceAccount ? 'Present' : 'Missing');
    
    if (!serviceAccount || !sheetId) {
      console.log('❌ Missing credentials');
      return NextResponse.json({ 
        error: 'Missing Google Sheets credentials',
        details: {
          hasServiceAccount: !!serviceAccount,
          hasSheetId: !!sheetId
        }
      }, { status: 500 });
    }

    // Parse the service account JSON (can be base64 or raw JSON string)
    let credentials;
    try {
      console.log('🔧 Trying to parse as direct JSON...');
      credentials = JSON.parse(serviceAccount);
      console.log('✅ Parsed as direct JSON');
    } catch {
      console.log('🔧 Trying to parse as base64...');
      try {
        credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
        console.log('✅ Parsed as base64');
      } catch (base64Error) {
        console.log('❌ Failed to parse credentials:', base64Error);
        return NextResponse.json({ 
          error: 'Failed to parse service account credentials',
          details: 'Neither direct JSON nor base64 parsing worked'
        }, { status: 500 });
      }
    }

    console.log('📧 Service account email:', credentials?.client_email);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Attempting to fetch sheet data...');
    
    // Try to get sheet metadata first
    try {
      const sheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      console.log('📋 Sheet title:', sheetInfo.data.properties?.title);
      console.log('📄 Available sheets:', sheetInfo.data.sheets?.map(s => s.properties?.title));
    } catch (metaError) {
      console.log('❌ Failed to get sheet metadata:', metaError);
      return NextResponse.json({ 
        error: 'Failed to access sheet',
        details: 'Check if sheet ID is correct and service account has access'
      }, { status: 403 });
    }

    // Adjust the range as needed (e.g., 'Sheet1!A1:D')
    const range = 'Sheet1';
    console.log('📊 Fetching range:', range);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    console.log('✅ Data retrieved, rows:', response.data.values?.length || 0);
    return NextResponse.json({ 
      data: response.data.values,
      meta: {
        range: response.data.range,
        majorDimension: response.data.majorDimension
      }
    });
  } catch (error) {
    console.log('❌ API Error:', error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔄 POST API route called');
    
    const body = await request.json();
    const { soldiers } = body;
    
    console.log('📋 Received soldiers data:', JSON.stringify(soldiers, null, 2));
    
    if (!soldiers || !Array.isArray(soldiers) || soldiers.length === 0) {
      console.log('❌ No soldiers data provided');
      return NextResponse.json({ 
        error: 'No soldiers data provided'
      }, { status: 400 });
    }
    
    console.log(`📊 Processing ${soldiers.length} soldiers`);
    
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    console.log('📋 Sheet ID:', sheetId ? 'Present' : 'Missing');
    console.log('🔑 Service Account:', serviceAccount ? 'Present' : 'Missing');
    
    if (!serviceAccount || !sheetId) {
      console.log('❌ Missing credentials');
      return NextResponse.json({ 
        error: 'Missing Google Sheets credentials',
        details: {
          hasServiceAccount: !!serviceAccount,
          hasSheetId: !!sheetId
        }
      }, { status: 500 });
    }

    // Parse the service account JSON (can be base64 or raw JSON string)
    let credentials;
    try {
      console.log('🔧 Trying to parse as direct JSON...');
      credentials = JSON.parse(serviceAccount);
      console.log('✅ Parsed as direct JSON');
    } catch {
      console.log('🔧 Trying to parse as base64...');
      try {
        credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
        console.log('✅ Parsed as base64');
      } catch (base64Error) {
        console.log('❌ Failed to parse credentials:', base64Error);
        return NextResponse.json({ 
          error: 'Failed to parse service account credentials',
          details: 'Neither direct JSON nor base64 parsing worked'
        }, { status: 500 });
      }
    }

    console.log('📧 Service account email:', credentials?.client_email);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Attempting to append data to sheet...');
    
    // Format soldiers data for Google Sheets
    // Expected columns: ID, First Name, Last Name, Platoon, Status
    const values = soldiers.map(soldier => [
      soldier.id || '',
      soldier.firstName || soldier.name.split(' ')[0] || '',
      soldier.lastName || soldier.name.split(' ').slice(1).join(' ') || '',
      soldier.platoon || 'מסייעת',
      soldier.status === 'אחר' ? soldier.customStatus || 'אחר' : soldier.status
    ]);
    
    console.log('📝 Formatted data to append:', JSON.stringify(values, null, 2));
    console.log('🎯 Target range: Sheet1!A:E');
    
    // Test permissions first by trying to read the sheet
    try {
      console.log('🔍 Testing read permissions...');
      const testRead = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:E1',
      });
      console.log('✅ Read test successful:', testRead.data.values);
    } catch (readError) {
      console.log('❌ Read test failed:', readError);
      return NextResponse.json({ 
        error: 'Failed to read sheet - check permissions',
        details: (readError as Error).message
      }, { status: 403 });
    }
    
    console.log('📝 Attempting to append data...');
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: values,
      },
    });

    console.log('✅ Data appended successfully!');
    console.log('📊 Update details:', JSON.stringify(response.data.updates, null, 2));
    
    return NextResponse.json({ 
      success: true,
      updates: response.data.updates,
      addedRows: values.length,
      formattedData: values
    });
    
  } catch (error) {
    console.log('❌ POST API Error:', error);
    console.error('Full error details:', error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      details: 'Check server logs for full error details'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    console.log('🔄 PUT API route called');
    
    const body = await request.json();
    const { soldiers } = body;
    
    console.log('📋 Received soldiers for update:', JSON.stringify(soldiers, null, 2));
    
    if (!soldiers || !Array.isArray(soldiers) || soldiers.length === 0) {
      console.log('❌ No soldiers data provided');
      return NextResponse.json({ 
        error: 'No soldiers data provided'
      }, { status: 400 });
    }
    
    console.log(`📊 Processing ${soldiers.length} soldiers for updates`);
    
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!serviceAccount || !sheetId) {
      console.log('❌ Missing credentials');
      return NextResponse.json({ 
        error: 'Missing Google Sheets credentials'
      }, { status: 500 });
    }

    // Parse credentials
    let credentials;
    try {
      credentials = JSON.parse(serviceAccount);
    } catch {
      try {
        credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
      } catch (base64Error) {
        console.log('❌ Failed to parse credentials:', base64Error);
        return NextResponse.json({ 
          error: 'Failed to parse service account credentials'
        }, { status: 500 });
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Reading current sheet data to find rows to update...');
    
    // First, get all current data
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1',
    });

    const rows = currentData.data.values || [];
    if (rows.length < 2) {
      return NextResponse.json({ 
        error: 'Sheet appears to be empty or missing header row'
      }, { status: 400 });
    }

    console.log(`📊 Found ${rows.length} total rows in sheet`);

    // Skip header row and find matching soldiers
    const updates: Array<{
      range: string;
      values: string[][];
    }> = [];

    const [header, ...dataRows] = rows;
    console.log('📋 Header row:', header);

    soldiers.forEach(soldier => {
      const rowIndex = dataRows.findIndex(row => {
        const id = row[0] || '';
        const firstName = row[1] || '';
        const lastName = row[2] || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        return (soldier.id === id) && (soldier.name === fullName);
      });

      if (rowIndex !== -1) {
        const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 1-based indexing
        console.log(`🎯 Found soldier ${soldier.name} at row ${actualRowIndex}`);
        
        // Update status column (E) - column index 4
        const statusValue = soldier.status === 'אחר' ? soldier.customStatus || 'אחר' : soldier.status;
        
        updates.push({
          range: `Sheet1!E${actualRowIndex}`,
          values: [[statusValue]]
        });
        
        console.log(`📝 Will update row ${actualRowIndex} status to: ${statusValue}`);
      } else {
        console.log(`❌ Could not find soldier: ${soldier.name} (ID: ${soldier.id})`);
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ 
        error: 'No matching soldiers found in sheet to update'
      }, { status: 404 });
    }

    console.log(`📝 Performing ${updates.length} updates...`);
    
    // Perform batch update
    const batchUpdateResponse = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      },
    });

    console.log('✅ Batch update completed successfully!');
    console.log('📊 Update details:', JSON.stringify(batchUpdateResponse.data, null, 2));
    
    return NextResponse.json({ 
      success: true,
      updatedRows: updates.length,
      totalSoldiersReceived: soldiers.length,
      updates: batchUpdateResponse.data
    });
    
  } catch (error) {
    console.log('❌ PUT API Error:', error);
    console.error('Full error details:', error);
    return NextResponse.json({ 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      details: 'Check server logs for full error details'
    }, { status: 500 });
  }
}
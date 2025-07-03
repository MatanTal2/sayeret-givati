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
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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
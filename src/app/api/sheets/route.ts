import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  try {
    const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!serviceAccount || !sheetId) {
      return NextResponse.json({ error: 'Missing Google Sheets credentials' }, { status: 500 });
    }

    // Parse the service account JSON (can be base64 or raw JSON string)
    let credentials;
    try {
      credentials = JSON.parse(serviceAccount);
    } catch (e) {
      // Try base64 decode
      credentials = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf-8'));
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Adjust the range as needed (e.g., 'Sheet1!A1:D')
    const range = 'Sheet1';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    return NextResponse.json({ data: response.data.values });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 
#!/usr/bin/env bun

/**
 * Sync templates from Google Sheets to local CSV
 * Usage: bun run sync <spreadsheet-url>
 * Example: bun run sync https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=305368109
 */

const TEMPLATES_PATH = './public/templates.csv';

function parseSpreadsheetUrl(url: string): { id: string; gid: string } | null {
  // Extract ID from /d/{ID}/
  const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  // Extract GID from #gid={GID} or ?gid={GID}
  const gidMatch = url.match(/[#?]gid=(\d+)/);

  if (!idMatch) {
    return null;
  }

  return {
    id: idMatch[1],
    gid: gidMatch ? gidMatch[1] : '0', // Default to 0 if no GID specified
  };
}

async function syncTemplates(spreadsheetUrl: string) {
  console.log('🔄 Syncing templates from Google Sheets...');

  const parsed = parseSpreadsheetUrl(spreadsheetUrl);
  if (!parsed) {
    console.error('❌ Invalid Google Sheets URL');
    console.error('Expected format: https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID}');
    process.exit(1);
  }

  const { id, gid } = parsed;
  console.log(`📊 Spreadsheet ID: ${id}`);
  console.log(`📄 Sheet GID: ${gid}`);

  const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;

  try {
    const response = await fetch(exportUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvContent = await response.text();

    // Validate CSV has header
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const header = lines[0];
    if (!header.includes('name') || !header.includes('price')) {
      throw new Error('CSV must have "name" and "price" columns');
    }

    // Write to file
    await Bun.write(TEMPLATES_PATH, csvContent);

    console.log(`✅ Successfully synced ${lines.length - 1} templates to ${TEMPLATES_PATH}`);
  } catch (error) {
    console.error('❌ Failed to sync templates:', error);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('❌ Missing spreadsheet URL');
  console.error('Usage: bun run sync <spreadsheet-url>');
  console.error('Example: bun run sync https://docs.google.com/spreadsheets/d/YOUR_ID/edit#gid=GID');
  process.exit(1);
}

const spreadsheetUrl = args[0];
syncTemplates(spreadsheetUrl);
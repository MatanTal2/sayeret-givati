/**
 * Downloads a tool HTML file by name.
 * Uses fetch + Blob to force a file download regardless of browser behavior.
 */
export async function downloadTool(toolPath: string, downloadName: string): Promise<void> {
  const response = await fetch(toolPath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${toolPath}: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export async function downloadSrt(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download SRT: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

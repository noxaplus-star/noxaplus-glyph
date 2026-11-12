export function downloadText(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function openDocument(html: string): boolean {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  try { window.open(url, '_blank', 'noopener,noreferrer'); }
  catch { URL.revokeObjectURL(url); return false; }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

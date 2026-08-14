import JSZip from 'jszip';
import { REPOSITORY_SCRIPTS } from '../data/scriptsData';

export async function generateAndDownloadZip(customRevitVersion: string = '2026') {
  const zip = new JSZip();

  REPOSITORY_SCRIPTS.forEach(file => {
    // If it's a template or script that refers to target version, we can keep the dynamic version or original
    zip.file(file.path, file.content);
  });

  // Add dummy empty directories to complete repository structure
  zip.folder('logs');
  zip.folder('reports');
  zip.folder('installers');

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `Autodesk-BIM-Environment-Bootstrapper-v${customRevitVersion}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

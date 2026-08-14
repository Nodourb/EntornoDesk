import JSZip from 'jszip';
import { REPOSITORY_SCRIPTS } from '../data/scriptsData';
import { injectSecurityProtocolFix } from './systemCompatibility';

export async function generateAndDownloadZip(customRevitVersion: string = '2026') {
  const zip = new JSZip();

  REPOSITORY_SCRIPTS.forEach(file => {
    // Inject legacy TLS 1.2 / TLS 1.3 security protocol fix into all generated PowerShell scripts (.ps1)
    const finalContent = file.language === 'powershell' || file.path.endsWith('.ps1')
      ? injectSecurityProtocolFix(file.content, file.path)
      : file.content;

    zip.file(file.path, finalContent);
  });

  // Add empty directories to complete repository structure
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

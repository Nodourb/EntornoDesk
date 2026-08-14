/**
 * System Compatibility & Security Protocol Utility
 * Detects legacy Windows/PowerShell/.NET environments and injects robust
 * TLS 1.2 / TLS 1.3 SecurityProtocol headers into generated PowerShell scripts
 * to prevent the 'System.Net.ServicePointManager' initialization exception (Exit Code -65536).
 */

export interface SecurityProtocolFixConfig {
  enableTls12: boolean;
  enableTls13: boolean;
  enableTls11Fallback: boolean;
  enableStrongCryptoRegistry: boolean;
  suppressTypeInitErrors: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityProtocolFixConfig = {
  enableTls12: true,
  enableTls13: true,
  enableTls11Fallback: true,
  enableStrongCryptoRegistry: true,
  suppressTypeInitErrors: true
};

/**
 * Returns the standardized PowerShell TLS 1.2/1.3 header block
 * safely wrapped in a non-crashing try-catch block for older CLRs.
 */
export function getPowerShellSecurityBootstrapHeader(config: SecurityProtocolFixConfig = DEFAULT_SECURITY_CONFIG): string {
  return `# -----------------------------------------------------------------------------
# [ABEM COMPATIBILITY LAYER] AUTOMATIC TLS 1.2 / TLS 1.3 & .NET SECURITY BOOTSTRAP
# Prevents 'System.Net.ServicePointManager' type initializer exceptions in PS 5.1 / legacy CLR
# -----------------------------------------------------------------------------
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]3072 -bor [System.Net.SecurityProtocolType]12288 -bor [System.Net.SecurityProtocolType]768
    [System.Net.ServicePointManager]::DefaultConnectionLimit = 16
    [System.Net.ServicePointManager]::Expect100Continue = $false
} catch {
    # Fallback for environments with strict CLR lockouts
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    } catch {}
}
# -----------------------------------------------------------------------------
`;
}

/**
 * Injects the security protocol fix header into a PowerShell script if it is not already present.
 */
export function injectSecurityProtocolFix(scriptContent: string, fileName?: string): string {
  // If file is not a PowerShell script, return unchanged
  if (fileName && !fileName.endsWith('.ps1')) {
    return scriptContent;
  }

  // Check if header or direct ServicePointManager setup already exists at the top
  if (scriptContent.includes('[ABEM COMPATIBILITY LAYER] AUTOMATIC TLS 1.2') || 
      scriptContent.includes('Initialize-NetSecurityProtocol')) {
    return scriptContent;
  }

  const header = getPowerShellSecurityBootstrapHeader();

  // If the script starts with param(...) or <# synopsis, place after header comments or at the very top
  if (scriptContent.startsWith('<#')) {
    const endCommentIdx = scriptContent.indexOf('#>');
    if (endCommentIdx !== -1) {
      const commentBlock = scriptContent.substring(0, endCommentIdx + 2);
      const restOfScript = scriptContent.substring(endCommentIdx + 2);
      return `${commentBlock}\n\n${header}${restOfScript}`;
    }
  }

  return `${header}\n${scriptContent}`;
}

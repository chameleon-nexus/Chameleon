# Chameleon Dependencies Installer
# Encoding: UTF-8 with BOM

# ================= Administrator Privileges Check =================
# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "------------------------------------------------------------" -ForegroundColor Red
    Write-Host "Error: Administrator privileges required." -ForegroundColor Red
    Write-Host "Please right-click on PowerShell, select 'Run as Administrator', and re-run this script." -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Red
    
    # Wait for user to see the message
    Start-Sleep -Seconds 10
    # Exit script
    exit 1
}

Write-Host "✓ Administrator privileges confirmed" -ForegroundColor Green
# =================================================================

Write-Host "Starting Chameleon dependencies installation..." -ForegroundColor Green

# 1. Check and install Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
if (!(Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Downloading and installing Node.js..."
    # Download Node.js LTS
    $nodeUrl = "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi"
    $nodeInstaller = "$env:TEMP\nodejs.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller
    
    # Silent install Node.js
    Start-Process msiexec.exe -ArgumentList "/i $nodeInstaller /quiet /norestart" -Wait
    
    # Refresh environment variables
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    
    Write-Host "Node.js installation completed" -ForegroundColor Green
} else {
    Write-Host "Node.js already exists" -ForegroundColor Green
}

# 2. Install Claude Code
Write-Host "Installing Claude Code..." -ForegroundColor Yellow
try {
    npm install -g @anthropic-ai/claude-code
    # Verify installation
    if (Get-Command "claude" -ErrorAction SilentlyContinue) {
        Write-Host "Claude Code installation completed and verified" -ForegroundColor Green
    } else {
        Write-Host "Claude Code installation may have failed - command not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Claude Code installation failed: $_" -ForegroundColor Red
}

# 3. Uninstall old Claude Code Router and install new one (Chameleon Nexus Fork)
Write-Host "Uninstalling old Claude Code Router..." -ForegroundColor Yellow
try {
    npm uninstall -g @musistudio/claude-code-router
    Write-Host "Old Claude Code Router uninstalled" -ForegroundColor Green
} catch {
    Write-Host "Old Claude Code Router uninstall failed or not found: $_" -ForegroundColor Yellow
}

Write-Host "Installing Claude Code Router (Chameleon Nexus Fork)..." -ForegroundColor Yellow
try {
    npm install -g @chameleon-nexus-tech/claude-code-router
    Write-Host "Claude Code Router (Chameleon Nexus Fork) installation completed" -ForegroundColor Green
} catch {
    Write-Host "Claude Code Router installation failed: $_" -ForegroundColor Red
    Write-Host "Note: If you see 404 error, the package may still be syncing to npm registry. Please wait a few minutes and try again." -ForegroundColor Yellow
}

# 4. Configure Router with preset API key
Write-Host "Configuring Claude Code Router..." -ForegroundColor Yellow
$configContent = @"
{
  "LOG": true,
  "LOG_LEVEL": "debug",
  "CLAUDE_PATH": "",
  "HOST": "127.0.0.1",
  "PORT": 3456,
  "APIKEY": "ad5769eb-526c-4067-b986-4f4f6224e8b5",
  "API_TIMEOUT_MS": 30000,
  "PROXY_URL": "",
  "transformers": [],
  "Providers": [
    {
      "name": "volcengine",
      "api_base_url": "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      "api_key": "ad5769eb-526c-4067-b986-4f4f6224e8b5",
      "models": [
        "deepseek-v3-250324"
      ],
      "transformer": {
        "use": [
          "deepseek"
        ]
      }
    }
  ],
  "StatusLine": {
    "enabled": false,
    "currentStyle": "default",
    "default": {
      "modules": []
    },
    "powerline": {
      "modules": []
    }
  },
  "Router": {
    "default": "volcengine,deepseek-v3-250324",
    "background": "volcengine,deepseek-v3-250324",
    "think": "volcengine,deepseek-v3-250324",
    "longContext": "volcengine,deepseek-v3-250324",
    "longContextThreshold": 60000,
    "webSearch": "volcengine,deepseek-v3-250324",
    "image": "volcengine,deepseek-v3-250324"
  },
  "CUSTOM_ROUTER_PATH": ""
}
"@

# Ensure config directory exists
$configDir = "$env:USERPROFILE\.claude-code-router"
if (!(Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force
    Write-Host "Created config directory: $configDir"
}

# Write config file
$configPath = "$configDir\config.json"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "Router configuration completed, config file location: $configPath" -ForegroundColor Green

# 5. Configure Environment Variables
Write-Host "Configuring environment variables..." -ForegroundColor Yellow
try {
    # Get npm global packages path
    $npmGlobalPath = npm config get prefix
    if (![string]::IsNullOrWhiteSpace($npmGlobalPath)) {
        Write-Host "Found npm global path: $npmGlobalPath" -ForegroundColor Green
        
        # Get current user PATH environment variable
        $userPathKey = "Registry::HKEY_CURRENT_USER\Environment"
        $currentPath = (Get-ItemProperty -Path $userPathKey -Name "Path" -ErrorAction SilentlyContinue).Path
        if ([string]::IsNullOrWhiteSpace($currentPath)) {
            $currentPath = ""
        }
        
        # Check if npm path already exists in PATH
        $pathArray = $currentPath -split ';'
        if ($pathArray -contains $npmGlobalPath) {
            Write-Host "Environment variable PATH already contains npm path." -ForegroundColor Green
        } else {
            # Add new path if not exists
            Write-Host "Adding npm path to user environment variable PATH..." -ForegroundColor Yellow
            $newPath = $currentPath + ";" + $npmGlobalPath
            
            # Use Set-ItemProperty to permanently modify PATH in registry
            Set-ItemProperty -Path $userPathKey -Name "Path" -Value $newPath
            
            Write-Host "Successfully updated user environment variable PATH!" -ForegroundColor Green
        }
        
        # Broadcast message to notify all programs that environment variables have been updated
        Write-Host "Broadcasting system message to refresh environment variables..." -ForegroundColor Yellow
        $HWND_BROADCAST = [System.IntPtr] 0xffff;
        $WM_SETTINGCHANGE = 0x1a;
        Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        
        public class User32 {
            [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)]
            public static extern IntPtr SendMessageTimeout(
                IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
                uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
        }
"@
        $result = [UIntPtr]::Zero
        [User32]::SendMessageTimeout($HWND_BROADCAST, $WM_SETTINGCHANGE, [UIntPtr]::Zero, "Environment", 2, 1000, [ref]$result) | Out-Null
        
        Write-Host "Environment variables configured successfully!" -ForegroundColor Green
        
    } else {
        Write-Host "Warning: Could not get npm global path. Environment variables may not be configured correctly." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Environment configuration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please restart VS Code manually to ensure environment variables are loaded." -ForegroundColor Yellow
}

# 6. Start Router
Write-Host "Starting Claude Code Router..." -ForegroundColor Yellow
try {
    # Use ccr restart to ensure the service starts properly
    $ccrProcess = Start-Process -FilePath "ccr" -ArgumentList "restart" -WindowStyle Hidden -PassThru -Wait
    
    if ($ccrProcess.ExitCode -eq 0) {
        Write-Host "Router started successfully." -ForegroundColor Green
    } else {
        Write-Host "Router startup completed with exit code: $($ccrProcess.ExitCode)" -ForegroundColor Yellow
    }
    
    # Wait a moment for the service to initialize
    Start-Sleep -Seconds 3
    
    # Verify the service is running
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:3456/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "Router is running on http://127.0.0.1:3456" -ForegroundColor Green
    } catch {
        Write-Host "Router may still be starting up. Please check with 'ccr status'" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Failed to start router: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please manually execute: ccr restart" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Chameleon installation completed!" -ForegroundColor Green
Write-Host "Important notes:" -ForegroundColor Yellow
Write-Host "   1. Please restart VS Code to ensure all functions work properly"
Write-Host "   2. Environment variables have been configured automatically"
Write-Host "   3. To change API Key, please edit: $configPath"
Write-Host "   4. If you encounter issues, please manually execute: ccr status to check status"
Write-Host ""
Write-Host "Troubleshooting tips:" -ForegroundColor Cyan
Write-Host "   • Network issues: If download failed, check firewall/proxy settings"
Write-Host "   • For company networks: configure npm proxy with 'npm config set proxy http://your-proxy:port'"
Write-Host "   • Router status: Visit http://127.0.0.1:3456/health to check if router is running"
Write-Host "   • Environment issues: If claude.cmd not found, restart VS Code and try again"

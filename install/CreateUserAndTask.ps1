# User and file settings
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

# Copy the file, overwriting if it already exists
$scriptPath = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$sourceFile = Join-Path -Path $scriptPath -ChildPath $fileName
Copy-Item -Path $sourceFile -Destination $filePath -Force
Write-Host "File copied/overwritten: $filePath"

# Create the scheduled task
$action = New-ScheduledTaskAction -Execute $filePath
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

try {
    Register-ScheduledTask -TaskName "MonitorStartupTask" -Action $action -Trigger $trigger -Principal $principal -ErrorAction Stop
    Write-Host "Scheduled task created successfully."
} catch {
    Write-Host "Error creating task: $_"
}

Write-Host "Setup completed."

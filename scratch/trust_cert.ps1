$cert = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.Thumbprint -eq 'A61988B1C2B9757B6700D6D96508794938A4987F' }
if ($cert) {
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    Write-Host "Certificate added to Trusted Root Certification Authorities!"
}

$file = "d:\VideoPilot Pro\dist_installer\VideoPilot Pro Setup 1.1.0.exe"
Get-AuthenticodeSignature -FilePath $file

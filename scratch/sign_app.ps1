$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=VideoPilot Pro Trusted Publisher" -CertStoreLocation "Cert:\CurrentUser\My"

$store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
$store.Open("ReadWrite")
$store.Add($cert)
$store.Close()

Write-Host "Created and trusted self-signed certificate: $($cert.Thumbprint)"

$setupFile = "d:\VideoPilot Pro\dist_installer\VideoPilot Pro Setup 1.1.0.exe"
$unpackedFile = "d:\VideoPilot Pro\dist_installer\win-unpacked\VideoPilot Pro.exe"

if (Test-Path $setupFile) {
    $sig = Set-AuthenticodeSignature -FilePath $setupFile -Certificate $cert
    Write-Host "Signed Setup Installer: $($sig.Status)"
}

if (Test-Path $unpackedFile) {
    $sig2 = Set-AuthenticodeSignature -FilePath $unpackedFile -Certificate $cert
    Write-Host "Signed Unpacked Executable: $($sig2.Status)"
}

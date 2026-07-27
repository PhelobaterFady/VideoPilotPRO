$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=VideoPilotPro" -CertStoreLocation "Cert:\CurrentUser\My"
$file = "d:\VideoPilot Pro\dist_installer\VideoPilot Pro Setup 1.1.0.exe"
Set-AuthenticodeSignature -FilePath $file -Certificate $cert
Get-AuthenticodeSignature -FilePath $file

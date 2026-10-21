$base = "c:\Users\hp\OneDrive\Documents\bulkEmail"
$dirs = "src/lib/components/ui","src/lib/components/dashboard","src/lib/components/campaigns","src/lib/components/documents","src/lib/components/billing","src/lib/components/admin","src/lib/server/auth","src/lib/server/db","src/lib/server/services/campaigns","src/lib/server/services/credits","src/lib/server/services/documents","src/lib/server/services/payments","src/lib/server/services/smtp","src/lib/server/services/queues","src/lib/server/services/spreadsheets","src/lib/repositories","src/lib/security","src/lib/schemas","src/lib/stores","src/lib/utils","src/lib/types","src/routes","supabase/migrations","supabase/functions","static/examples","tests/unit","tests/integration","tests/e2e","docs/architecture","docs/deployment","docs/api","docs/security"
foreach ($d in $dirs) {
    $path = Join-Path $base ($d -replace "/", "\")
    New-Item -ItemType Directory -Force $path | Out-Null
}
Write-Output "All directories created"

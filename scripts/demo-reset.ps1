# =====================================================================
#  LastBite - Nạp lại dữ liệu demo (và sao lưu) bằng MỘT lệnh
#
#  Chạy ở thư mục gốc dự án (C:\...\LastBite):
#     powershell -ExecutionPolicy Bypass -File scripts\demo-reset.ps1
#  Chỉ sao lưu database hiện tại (không nạp lại):
#     powershell -ExecutionPolicy Bypass -File scripts\demo-reset.ps1 -BackupOnly
#
#  Script làm:
#    1. Hỏi mật khẩu MySQL một lần
#    2. Sao lưu database hiện tại ra database\backups\lastbite_<ngày-giờ>.sql (nếu database đã có)
#    3. Chạy schema.sql -> seed.sql -> seed_images.sql
#    4. In số tài khoản / quán / tin đang mở để kiểm tra nhanh
# =====================================================================
param(
  [string]$User = "root",
  [switch]$BackupOnly
)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
  Write-Host "Không tìm thấy lệnh mysql. Hãy thêm thư mục bin của MySQL vào PATH." -ForegroundColor Red
  exit 1
}

$secure = Read-Host "Mật khẩu MySQL của tài khoản $User" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
$env:MYSQL_PWD = $plain   # chỉ tồn tại trong cửa sổ PowerShell này, script xoá ngay khi xong

function Invoke-Sql([string]$Database, [string]$Command) {
  if ($Database) { & mysql -u $User --default-character-set=utf8mb4 $Database -e $Command }
  else { & mysql -u $User --default-character-set=utf8mb4 -e $Command }
  if ($LASTEXITCODE -ne 0) { throw "Lệnh MySQL lỗi: $Command" }
}

try {
  # 2. Sao lưu (dùng --result-file vì dấu > của PowerShell ghi file sai bảng mã)
  $exists = & mysql -u $User -N -e "SHOW DATABASES LIKE 'lastbite'"
  if ($exists) {
    New-Item -ItemType Directory -Force -Path "database\backups" | Out-Null
    $file = "database\backups\lastbite_{0}.sql" -f (Get-Date -Format "yyyyMMdd_HHmm")
    & mysqldump -u $User --default-character-set=utf8mb4 --single-transaction --routines lastbite "--result-file=$file"
    if ($LASTEXITCODE -ne 0) { throw "mysqldump lỗi" }
    Write-Host "Đã sao lưu: $file" -ForegroundColor Green
  }
  if ($BackupOnly) { return }

  # 3. Nạp lại dữ liệu demo
  Write-Host "Đang chạy schema.sql ..."
  Invoke-Sql "" "source database/schema.sql"
  Write-Host "Đang chạy seed.sql ..."
  Invoke-Sql "lastbite" "source database/seed.sql"
  Write-Host "Đang chạy seed_images.sql ..."
  Invoke-Sql "lastbite" "source database/seed_images.sql"

  # 4. Kiểm tra nhanh
  Invoke-Sql "lastbite" "SELECT (SELECT COUNT(*) FROM users) AS tai_khoan, (SELECT COUNT(*) FROM stores WHERE status='approved') AS quan_da_duyet, (SELECT COUNT(*) FROM listings WHERE status='active' AND pickup_end > NOW()) AS tin_con_han, NOW() AS gio_mysql;"
  Write-Host "Xong. Nếu backend đang chạy, gõ rs trong cửa sổ nodemon để chạy lại." -ForegroundColor Green
}
finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

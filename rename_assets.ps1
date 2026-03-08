
# ================================================================
# rename_assets.ps1
# Copy & rename all Thai/special-char asset folders to ASCII names
# Output root: frontend/public/assets_employer
# ================================================================

$src  = "e:\GymemoGame\frontend\public\assets\Assets'Employer"
$dst  = "e:\GymemoGame\frontend\public\assets_employer"

# Mapping: relative source path -> relative destination path
# We handle every subfolder that contains Thai or special characters
$map = @(
    # Root files
    @{ S = "Logo - 1.png";                 D = "logo.png" },

    # ตัวละคร  -> characters
    @{ S = "ตัวละคร\คุณตา.png";            D = "characters\grandpa.png" },
    @{ S = "ตัวละคร\บุหรี่.png";           D = "characters\cigarette.png" },
    @{ S = "ตัวละคร\พฤติกรมมสุขภาพ.png";   D = "characters\health-behavior.png" },
    @{ S = "ตัวละคร\สมอง.png";             D = "characters\brain.png" },
    @{ S = "ตัวละคร\อุบัติดหตุ.png";       D = "characters\accident.png" },
    @{ S = "ตัวละคร\แอลกอฮอล์.png";        D = "characters\alcohol.png" },
    @{ S = "ตัวละคร\ไวรัส.png";            D = "characters\virus.png" },

    # Profile ผู้เล่น -> profiles
    # ตัวเปล่า -> base
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0857.PNG"; D = "profiles\base\IMG_0857.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0858.PNG"; D = "profiles\base\IMG_0858.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0859.PNG"; D = "profiles\base\IMG_0859.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0860.PNG"; D = "profiles\base\IMG_0860.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0861.PNG"; D = "profiles\base\IMG_0861.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0862.PNG"; D = "profiles\base\IMG_0862.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0863.PNG"; D = "profiles\base\IMG_0863.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0864.PNG"; D = "profiles\base\IMG_0864.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0865.PNG"; D = "profiles\base\IMG_0865.PNG" },
    @{ S = "Profile ผู้เล่น\ตัวเปล่า\IMG_0866.PNG"; D = "profiles\base\IMG_0866.PNG" }
)

# Entire-folder copy mappings (src folder -> dst folder) for bigger sets
$folderMap = @(
    @{ S = "Assess ด้าน\มิติสัมพันธ์\choices_cropped"; D = "assess\spatial\choices_cropped" },
    @{ S = "Assess ด้าน\มิติสัมพันธ์";                 D = "assess\spatial" },
    @{ S = "Assess ด้าน\บริหารจัดการ\หมวดหมู่ที่ 3";  D = "assess\management\cat3" },
    @{ S = "Assess ด้าน\บริหารจัดการ\หมวดหมู่ที่ 4";  D = "assess\management\cat4" },
    @{ S = "Assess ด้าน\บริหารจัดการ\หมวดหมู่ที่1";   D = "assess\management\cat1" },
    @{ S = "Assess ด้าน\บริหารจัดการ\หมวดหมู่ที่2";   D = "assess\management\cat2" },
    @{ S = "Assess ด้าน\บริหารจัดการ\เกมเขาวงกต";     D = "assess\management\maze" },
    @{ S = "Assess ด้าน\คำนวณ\ตัวเลข";                D = "assess\calculation\numbers" },
    @{ S = "Assess ด้าน\คำนวณ\ภาพจุด";                D = "assess\calculation\dots" },
    @{ S = "Assess ด้าน\คำนวณ\เกมบวกเลขลบเลข";        D = "assess\calculation\arithmetic" },
    @{ S = "Background";                                D = "background" },
    @{ S = "UI";                                        D = "ui" }
)

Write-Host "=== Starting asset copy & rename ===" -ForegroundColor Cyan

# 1. Copy individual files
foreach ($entry in $map) {
    $srcFile = Join-Path $src $entry.S
    $dstFile = Join-Path $dst $entry.D
    $dstDir  = Split-Path $dstFile -Parent
    if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination $dstFile -Force
        Write-Host "  [FILE] $($entry.S) -> $($entry.D)" -ForegroundColor Green
    } else {
        Write-Host "  [MISS] $srcFile" -ForegroundColor Yellow
    }
}

# 2. Copy entire folders
foreach ($entry in $folderMap) {
    $srcDir = Join-Path $src $entry.S
    $dstDir = Join-Path $dst $entry.D
    if (Test-Path $srcDir) {
        Copy-Item -Path $srcDir -Destination $dstDir -Recurse -Force
        Write-Host "  [DIR]  $($entry.S) -> $($entry.D)" -ForegroundColor Green
    } else {
        Write-Host "  [MISS] $srcDir" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Done! New assets root: $dst ===" -ForegroundColor Cyan

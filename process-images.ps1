# ------------------------------------------------------------------
#  Resize / crop / re-encode source photos for the web.
#  Uses .NET System.Drawing (built into Windows) - no npm, no build
#  step for the site itself. Run once after adding new source images:
#      powershell -File process-images.ps1
# ------------------------------------------------------------------
Add-Type -AssemblyName System.Drawing

$src = "E:\Kazi Connect\site\assets\img"
$out = "E:\Kazi Connect\site\assets\img"

function Save-Jpeg {
    param($Bitmap, $Path, $Quality = 78)
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
             Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality, [int64]$Quality)
    $Bitmap.Save($Path, $codec, $ep)
    $ep.Dispose()
}

function Convert-Image {
    param(
        [string]$In, [string]$Out, [int]$TargetW,
        [int]$CropX = -1, [int]$CropY = -1, [int]$CropW = -1, [int]$CropH = -1,
        [double]$Ratio = 0    # >0 forces an output aspect ratio (w/h), centre-cropped
    )
    $img = [System.Drawing.Image]::FromFile($In)
    try {
        # source rectangle
        if ($CropW -gt 0) {
            $sx = $CropX; $sy = $CropY; $sw = $CropW; $sh = $CropH
        } else {
            $sx = 0; $sy = 0; $sw = $img.Width; $sh = $img.Height
        }
        # force aspect ratio by centre-cropping the source rect
        if ($Ratio -gt 0) {
            $current = $sw / $sh
            if ($current -gt $Ratio) {         # too wide -> trim sides
                $newW = [int]($sh * $Ratio)
                $sx = $sx + [int](($sw - $newW) / 2); $sw = $newW
            } elseif ($current -lt $Ratio) {   # too tall -> trim top/bottom
                $newH = [int]($sw / $Ratio)
                $sy = $sy + [int](($sh - $newH) / 2); $sh = $newH
            }
        }
        $targetH = [int][Math]::Round($TargetW * $sh / $sw)
        $bmp = New-Object System.Drawing.Bitmap($TargetW, $targetH)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $destRect = New-Object System.Drawing.Rectangle(0, 0, $TargetW, $targetH)
        $srcRect  = New-Object System.Drawing.Rectangle($sx, $sy, $sw, $sh)
        $g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        $g.Dispose()
        Save-Jpeg -Bitmap $bmp -Path $Out
        $bmp.Dispose()
        $kb = [math]::Round((Get-Item $Out).Length / 1KB)
        "{0,-26} {1}x{2}  {3} KB" -f (Split-Path $Out -Leaf), $TargetW, $targetH, $kb
    } finally { $img.Dispose() }
}

# 1. Team collaborating in an office  -> home page band
Convert-Image "$src\pexels-pavel-danilyuk-7658429.jpg" "$out\team-collaboration.jpg" 1400 -Ratio 1.85

# 2. Two colleagues reviewing documents -> Services page
Convert-Image "$src\pexels-kindelmedia-7688435.jpg" "$out\consultation.jpg" 1400 -Ratio 1.85

# 3. Laptop showing dashboards -> Software page (analytics)
Convert-Image "$src\pexels-kampus-6248959.jpg" "$out\analytics.jpg" 1200 -Ratio 1.6

# 4. Person working at a desk -> Software page (secondary)
Convert-Image "$src\pexels-mizunokozuki-12902992.jpg" "$out\workplace.jpg" 800 -Ratio 0.8

# NOTE: pexels-ai25studioai-5466247.jpg (presenter holding a chart) is
# deliberately NOT used. The chart carries an ielts-exam.net watermark,
# and every crop that removes it reduces the frame to a tight headshot,
# which on a company site reads as "this is our staff member".

# 5. Open Graph share card (1200x630) from the meeting photo
Convert-Image "$src\pexels-kindelmedia-7688435.jpg" "$out\og-image.jpg" 1200 -Ratio 1.9048

"`nDone."

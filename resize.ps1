Add-Type -AssemblyName System.Drawing
$inPath = "f:\Clissic FIle\vs code\NextGen_management_system\frontend\public\favicon.png"
$outPath = "f:\Clissic FIle\vs code\NextGen_management_system\frontend\public\favicon_small.png"

$img = [System.Drawing.Image]::FromFile($inPath)
$bmp = new-object System.Drawing.Bitmap 64, 64
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graph.DrawImage($img, 0, 0, 64, 64)
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graph.Dispose()
$bmp.Dispose()
$img.Dispose()

Remove-Item $inPath
Rename-Item $outPath -NewName "favicon.png"

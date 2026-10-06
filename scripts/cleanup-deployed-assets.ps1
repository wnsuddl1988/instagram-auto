<#
  배포 완료 편의 합성·중간 산출물 정리 (2026-10-06, Owner 요청: "배포해서 정리해도 되는 영상·이미지 합성본 삭제").

  기본 실행 = 미리보기(아무것도 지우지 않고 목록·용량만 출력, 목록은 C:\tmp\cleanup-plan.txt에 저장).
  실제 삭제는 -Execute 를 붙이고 확인 질문에 DELETE 를 입력해야 한다.

  배포 완료 범위: 황소 1~21편, 부엉 파일 ep22 이하(표시 21편까지, 옛 owl-epN 포함). 아직 게시 전인
  황소 22편(bull-ep22*)·부엉 파일 ep23(owl-v2-ep23*, owl-ep23*)·고정 CTA·캐릭터 참조 이미지는 절대 건드리지 않는다.

  기본(항상) 정리 대상
    A 테스트·감사: quality-v2-test, opening-motion-test, AUDIT-all-episodes, 배포 완료 편의 *-test* 폴더
    B 합성 중간본: 배포 완료 편의 *-assembly*, *-cta-merge*, *-cta-header* 폴더 (C:\tmp, C:\tmp\money-shorts-os)
    C(선택 -OldFinals) 이전 버전 완성본: 한 편에 final 폴더가 여러 개면 게시에 쓴 폴더(콘텐츠 유닛의 finalMasteredPath) 하나만 남기고 삭제
        (콘텐츠 유닛을 못 찾으면 가장 최근 폴더를 남긴다 — 옛 편은 실제 게시본이 아닌 버전이 남을 수 있어 선택 항목)
    D 남긴 완성본 폴더 안의 중간 파일: owl_episode_final.mp4 / _nowm.mp4 / cta_with_header.mp4 / scenes1to7.mp4
        (같은 폴더에 owl_episode_final_mastered.mp4가 있을 때만 삭제 — 마스터·qa 보고서·qa 시트는 남김)

  선택 스위치
    -Sources    배포 완료 편의 Veo 원본 클립(-videos)·이미지(-images) 폴더까지 (다시 조립할 일이 없을 때만)
    -Geumbaksa  금박사(운영 중단) 관련 C:\tmp\geumbaksa-* 폴더 전체
    -RepoCache  저장소 .next 빌드 캐시(다음 dev/build 때 다시 생김)
    -PublicVideos 저장소 public\videos의 옛 미리보기·QA 렌더 mp4(약 0.7GB, lh*·paid_qa는 남김)
    -Editorial  저장소 output\editorial-v2 안의 옛 실험 산출물(약 7.5GB: 코인 제작 재진입 v1~v4, pa5 캐릭터 시험, Blender 런타임). 폴더 자체는 남김
#>
param(
  [switch]$Execute,
  [switch]$OldFinals,
  [switch]$Sources,
  [switch]$Geumbaksa,
  [switch]$RepoCache,
  [switch]$Editorial,
  [switch]$PublicVideos
)
$ErrorActionPreference = 'Stop'
$tmp = 'C:\tmp'
$roots = @($tmp, (Join-Path $tmp 'money-shorts-os'))
$limits = @{ 'bull' = 21; 'owl-v2' = 22; 'owl' = 22 }   # 배포 완료 최대 편 번호(파일 기준)

function Test-Deployed([string]$name) {
  if ($name -match '^(bull|owl-v2|owl)-ep(\d+)') { return ([int]$Matches[2] -le $limits[$Matches[1]]) }
  return $false
}

$targets = New-Object System.Collections.Generic.List[object]
function Add-Target([string]$path, [string]$cat) { $targets.Add([pscustomobject]@{ Path = $path; Cat = $cat }) }

# A. 테스트·감사
foreach ($n in 'quality-v2-test', 'opening-motion-test', 'AUDIT-all-episodes') {
  $p = Join-Path $tmp $n
  if (Test-Path $p) { Add-Target $p 'A 테스트·감사' }
}
Get-ChildItem $tmp -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like '*-test*' -and (Test-Deployed $_.Name) } |
  ForEach-Object { Add-Target $_.FullName 'A 테스트·감사' }

# B. 합성 중간본
foreach ($r in $roots) {
  if (-not (Test-Path $r)) { continue }
  Get-ChildItem $r -Directory -ErrorAction SilentlyContinue |
    Where-Object { (Test-Deployed $_.Name) -and ($_.Name -match '-(assembly|cta-merge|cta-header)') } |
    ForEach-Object { Add-Target $_.FullName 'B 합성 중간본' }
}

# C/D. 완성본 폴더 — 게시에 쓴 폴더 파악
$published = @{}
Get-ChildItem $tmp -Directory -Filter '*publish*' -ErrorAction SilentlyContinue | ForEach-Object {
  $f = Join-Path $_.FullName 'owl-content-unit.json'
  if (Test-Path $f) {
    try {
      $j = Get-Content $f -Raw -Encoding UTF8 | ConvertFrom-Json
      if ($j.finalMasteredPath) { $published[(Split-Path -Parent ($j.finalMasteredPath -replace '/', '\')).ToLower()] = $true }
    } catch { }
  }
}
$finals = @()
foreach ($r in $roots) {
  if (-not (Test-Path $r)) { continue }
  $finals += Get-ChildItem $r -Directory -ErrorAction SilentlyContinue |
    Where-Object { (Test-Deployed $_.Name) -and ($_.Name -match '^(bull|owl-v2|owl)-ep\d+-(episode-)?final') }
}
$keptFinals = New-Object System.Collections.Generic.List[object]
$finals | Group-Object { if ($_.Name -match '^((bull|owl-v2|owl)-ep\d+)-') { $Matches[1] } } | ForEach-Object {
  $g = @($_.Group)
  $keep = @($g | Where-Object { $published.ContainsKey($_.FullName.ToLower()) })
  if ($keep.Count -eq 0) { $keep = @($g | Sort-Object LastWriteTime -Descending | Select-Object -First 1) }
  if ($OldFinals) {
    foreach ($k in $keep) { $keptFinals.Add($k) }
    $g | Where-Object { $keep.FullName -notcontains $_.FullName } | ForEach-Object { Add-Target $_.FullName 'C 이전 버전 완성본' }
  } else {
    foreach ($k in $g) { $keptFinals.Add($k) }   # C 스위치가 없으면 모든 완성본 폴더를 남기고 D(중간 파일)만 정리
  }
}
$interNames = 'owl_episode_final.mp4', 'owl_episode_final_nowm.mp4', 'cta_with_header.mp4', 'scenes1to7.mp4'
foreach ($k in $keptFinals) {
  if (-not (Test-Path (Join-Path $k.FullName 'owl_episode_final_mastered.mp4'))) { continue }
  foreach ($n in $interNames) {
    $p = Join-Path $k.FullName $n
    if (Test-Path $p) { Add-Target $p 'D 완성본 폴더 중간 파일' }
  }
}

# E. 원본 클립·이미지 (선택)
if ($Sources) {
  foreach ($r in $roots) {
    if (-not (Test-Path $r)) { continue }
    Get-ChildItem $r -Directory -ErrorAction SilentlyContinue |
      Where-Object { (Test-Deployed $_.Name) -and ($_.Name -match '^(bull|owl-v2|owl)-ep\d+-(videos|images|motion)') } |
      ForEach-Object { Add-Target $_.FullName 'E Veo 원본 클립·이미지' }
  }
}
# F. 금박사 (선택)
if ($Geumbaksa) {
  # 고정 CTA 클립(geumbaksa-cta-fixed*)은 코드(run-owl-episode-with-fixed-cta-once.mjs)가 경로를 참조하고 다시 만들 수 없어 남긴다.
  Get-ChildItem $tmp -Directory -Filter 'geumbaksa-*' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike 'geumbaksa-cta-fixed*' } |
    ForEach-Object { Add-Target $_.FullName 'F 금박사(운영 중단)' }
}
# H. 저장소 output\editorial-v2 옛 실험 산출물 (선택 — 2026-08 코인 제작 재진입·pa5 캐릭터 시험, 현행 파이프라인과 무관, Owner 2026-10-06 "전부 지워도 돼")
#    폴더 자체는 남기고 안의 항목만 지운다(웹 UI가 폴더 존재를 기대할 수 있어서).
if ($Editorial) {
  $ed = 'C:\Users\PC\jjy\instagram-auto\output\editorial-v2'
  if (Test-Path $ed) {
    Get-ChildItem $ed -Force -ErrorAction SilentlyContinue | ForEach-Object { Add-Target $_.FullName 'H editorial-v2 옛 실험' }
  }
}
# I. 저장소 public\videos 옛 미리보기·QA 렌더 (선택 — 2026-05~07 구 웹 렌더러(render-v2·manual-render·review)가 브라우저 미리보기용으로 복사해 둔 파일,
#    현행 제작·배포 파이프라인과 무관, Owner 2026-10-06 "현재와 관련없는 거면 삭제"). 다른 프로젝트 샘플일 수 있는 lh*(home_problem_lab 추정)·paid_qa 폴더는 남긴다.
if ($PublicVideos) {
  $pv = 'C:\Users\PC\jjy\instagram-auto\public\videos'
  if (Test-Path $pv) {
    Get-ChildItem $pv -File -Force -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -notmatch '^lh' } |
      ForEach-Object { Add-Target $_.FullName 'I public/videos 옛 렌더' }
  }
}
# G. 저장소 빌드 캐시 (선택)
if ($RepoCache) {
  $p = 'C:\Users\PC\jjy\instagram-auto\.next'
  if (Test-Path $p) { Add-Target $p 'G 저장소 .next 캐시' }
}

# 안전장치: 게시 전 편·고정 자산은 어떤 경우에도 목록에서 제외 확인
$forbidden = 'bull-ep22', 'bull-ep2[3-9]', 'owl-v2-ep2[3-9]', 'owl-ep2[3-9]', 'bull-cta-fixed', 'owl-cta-fixed', 'character-reference', 'owl-cover-ep23', 'bull-cover-ep22'
$uniq = $targets | Sort-Object Path -Unique
foreach ($t in $uniq) {
  foreach ($f in $forbidden) {
    if ($t.Path -match $f) { throw "ABORT: 보호 대상이 삭제 목록에 들어왔습니다: $($t.Path)" }
  }
}
# 상위 폴더가 이미 목록에 있으면 하위 항목은 중복이므로 제외
$paths = $uniq.Path
$final = $uniq | Where-Object {
  $p = $_.Path
  -not ($paths | Where-Object { $_ -ne $p -and $p.StartsWith($_ + '\') })
}

function Get-Size([string]$p) {
  $item = Get-Item $p -Force
  if ($item.PSIsContainer) { return (Get-ChildItem $p -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum }
  return $item.Length
}
$rows = foreach ($t in $final) { [pscustomobject]@{ Cat = $t.Cat; MB = [math]::Round((Get-Size $t.Path) / 1MB, 0); Path = $t.Path } }
$rows | Sort-Object Cat, @{ Expression = 'MB'; Descending = $true } | Format-Table -AutoSize -Wrap | Out-String -Width 250 | Tee-Object -FilePath 'C:\tmp\cleanup-plan.txt' | Write-Host
"--- 카테고리별 합계 ---"
$rows | Group-Object Cat | ForEach-Object { '{0,-28} {1,5} 개  {2,8:N0} MB' -f $_.Name, $_.Count, ($_.Group | Measure-Object MB -Sum).Sum }
$totalMB = ($rows | Measure-Object MB -Sum).Sum
'합계: {0:N0} MB (약 {1:N1} GB)' -f $totalMB, ($totalMB / 1024)

if (-not $Execute) {
  Write-Host "`n[미리보기] 아무것도 삭제하지 않았습니다. 목록: C:\tmp\cleanup-plan.txt"
  Write-Host "실제로 지우려면: powershell -File scripts\cleanup-deployed-assets.ps1 -Execute  (선택: -Sources -Geumbaksa -RepoCache)"
  return
}
$ans = Read-Host "위 목록($($final.Count)개, 약 $([math]::Round($totalMB/1024,1)) GB)을 삭제합니다. 계속하려면 DELETE 를 입력"
if ($ans -ne 'DELETE') { Write-Host '취소했습니다.'; return }
foreach ($t in $final) {
  try { Remove-Item -LiteralPath $t.Path -Recurse -Force -ErrorAction Stop; Write-Host "삭제: $($t.Path)" }
  catch { Write-Host "실패: $($t.Path) — $($_.Exception.Message)" }
}
Write-Host '정리 완료.'

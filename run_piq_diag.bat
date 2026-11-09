@echo off
cd /d C:\Users\PC\jjy\ianpapa-stock-finder
python scratch\diag_v10_b_grade_analysis.py > C:\Users\PC\jjy\instagram-auto\piq_diag_out.txt 2>&1
echo EXIT_CODE=%ERRORLEVEL% >> C:\Users\PC\jjy\instagram-auto\piq_diag_out.txt

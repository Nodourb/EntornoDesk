# ABEM Workstation Smoke Test & Validation Checklist

1. **Extraction**: Unpack repository to `C:\BIM\AutodeskEnvironment`.
2. **Execute Safe Smoke Test**:
   - Right-click `Quick-Audit.bat` and choose **Run as Administrator**.
3. **Verify Output**:
   - Confirm all 10 engine components show `[PASS]` or `[WARN]`.
   - Confirm `System modifications performed: 0`.
   - Inspect generated log in `logs\ABEM_SmokeTest_YYYYMMDD_HHMMSS.log`.
   - Inspect JSON report in `reports\ABEM_SmokeTest_YYYYMMDD_HHMMSS.json`.

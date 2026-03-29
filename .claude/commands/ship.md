# /ship Command

> Build, verify, and prepare changes for deployment

## Purpose

The `/ship` command runs a complete validation pipeline to ensure changes are ready for production deployment.

## Usage

```
/ship
```

## Steps

1. **Run lint check**
   ```bash
   npm run lint
   ```
   - If errors exist, report them
   - Do not proceed if critical errors

2. **Run build**
   ```bash
   npm run build
   ```
   - Must complete successfully
   - Static export to `/out` directory

3. **Verify build output**
   ```bash
   ls -la out/
   ```
   - Confirm index.html exists
   - Check for expected assets

4. **Run tests** (when available)
   ```bash
   npm test
   ```
   - All tests must pass

5. **Report status**
   - List any warnings
   - Confirm ready for merge/deploy
   - Suggest next steps

## Success Criteria

- [ ] Lint passes (or warnings acceptable)
- [ ] Build completes without errors
- [ ] Output directory has expected files
- [ ] Tests pass (when implemented)

## On Failure

If any step fails:
1. Report the specific error
2. Suggest fixes if known
3. Do not continue to next steps
4. Ask if user wants help fixing

## Example Output

```
Ship Check Results
==================

✅ Lint: Passed (2 warnings)
✅ Build: Completed in 45s
✅ Output: 15 files in /out
⏭️  Tests: Skipped (not configured)

Ready to ship! Next steps:
1. Commit changes: git commit -m "..."
2. Push to master: git push origin master
3. Deployment will trigger automatically
```

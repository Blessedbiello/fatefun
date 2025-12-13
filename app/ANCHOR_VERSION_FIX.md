# Anchor Version Fix - CRITICAL

## Problem Analysis

The `_bn` undefined error was caused by a **version mismatch** between:
- **Frontend**: Using `@coral-xyz/anchor@0.30.1`
- **Backend**: IDLs generated with `Anchor 0.29.0`

### Root Cause

Anchor 0.30.x introduced breaking changes in:
1. IDL structure format (added `address` and `metadata` fields)
2. How the `Program` class parses IDL JSON
3. BigNumber (BN) handling in the constructor

When Anchor 0.30.1 tried to parse a 0.29.0 IDL, it failed when accessing `_bn` properties on undefined objects.

## Solution Applied

**Downgraded `@coral-xyz/anchor` from 0.30.1 to 0.29.0** to match the IDL version.

### Why npm install Kept Failing

The normal `npm install @coral-xyz/anchor@0.29.0` kept installing 0.30.1 because:
1. npm's cache was persistent
2. package.json was being auto-updated by some process
3. Standard `overrides` and `resolutions` weren't working

### Final Working Solution

**Manual tarball extraction:**

```bash
# Download correct version
wget https://registry.npmjs.org/@coral-xyz/anchor/-/anchor-0.29.0.tgz

# Extract
tar -xzf anchor-0.29.0.tgz

# Manually copy to node_modules
rm -rf app/node_modules/@coral-xyz/anchor
cp -r package app/node_modules/@coral-xyz/anchor
```

## ✅ Result

- Dev server starts successfully
- No `_bn` errors
- Program instantiation works correctly
- Frontend can now communicate with deployed Solana programs

## ⚠️ Important Notes

1. **DO NOT run `npm install` again** - it will try to reinstall 0.30.1
2. **If you need to add packages:** Use `npm install <package> --no-save` to avoid triggering a full reinstall
3. **Alternative permanent fix:** Regenerate IDLs with Anchor 0.30.x (requires redeploying programs)

## package.json Current State

```json
{
  "dependencies": {
    "@coral-xyz/anchor": "https://registry.npmjs.org/@coral-xyz/anchor/-/anchor-0.29.0.tgz"
  },
  "overrides": {
    "@coral-xyz/anchor": "0.29.0"
  },
  "resolutions": {
    "@coral-xyz/anchor": "0.29.0"
  }
}
```

## Next Steps

To permanently fix this issue, you have two options:

### Option 1: Keep Anchor 0.29.0 (Current Approach)
- Manually manage the anchor package
- Avoid `npm install` without care

### Option 2: Upgrade Everything to Anchor 0.30.x (Recommended for Production)
1. Update programs to use Anchor 0.30.x
2. Rebuild programs: `anchor build`
3. Regenerate IDLs (they'll have `address` and `metadata` fields)
4. Redeploy programs to devnet/mainnet
5. Update frontend IDL files
6. Update frontend to use `@coral-xyz/anchor@^0.30.1`

---

**Status:** ✅ Issue resolved - Frontend now working with Anchor 0.29.0
**Deployed Programs:** Still using Anchor 0.29.0 IDLs (compatible)

/**
 * Flash detection test — captures screenshots every 200ms for 5 seconds,
 * then computes per-pixel brightness variance across frames to detect flashing.
 */
import { chromium } from 'playwright';
import { createHash } from 'crypto';

const URL = 'http://localhost:3000';
const DURATION_MS = 5000;
const INTERVAL_MS = 200;

function hashBuffer(buf) {
  return createHash('md5').update(buf).digest('hex');
}

function pixelDiff(buf1, buf2) {
  if (buf1.length !== buf2.length) return 1;
  let diff = 0;
  // Compare every 4th byte (R channel only, skip alpha) for speed
  for (let i = 0; i < buf1.length; i += 4) {
    diff += Math.abs(buf1[i] - buf2[i]);
  }
  return diff / (buf1.length / 4);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Wait for fonts/images to settle
  await page.waitForTimeout(500);

  console.log(`Capturing frames every ${INTERVAL_MS}ms for ${DURATION_MS}ms...`);
  const frames = [];
  const hashes = [];

  const end = Date.now() + DURATION_MS;
  while (Date.now() < end) {
    const screenshot = await page.screenshot({ type: 'png' });
    const hash = hashBuffer(screenshot);
    frames.push(screenshot);
    hashes.push(hash);
    await page.waitForTimeout(INTERVAL_MS);
  }

  console.log(`\nCaptured ${frames.length} frames.`);

  // Count unique frames (hash-based)
  const uniqueHashes = new Set(hashes);
  console.log(`Unique frames: ${uniqueHashes.size} / ${frames.length}`);

  // Compute per-consecutive-frame diff
  const diffs = [];
  for (let i = 1; i < frames.length; i++) {
    diffs.push(pixelDiff(frames[i - 1], frames[i]));
  }

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const maxDiff = Math.max(...diffs);
  const highDiffFrames = diffs.filter(d => d > 2).length;

  console.log(`\nPer-frame pixel diff (R channel avg change per pixel):`);
  console.log(`  Average diff: ${avgDiff.toFixed(2)}`);
  console.log(`  Max diff:     ${maxDiff.toFixed(2)}`);
  console.log(`  Frames with notable change (>2): ${highDiffFrames} / ${diffs.length}`);

  // Report on changes
  diffs.forEach((d, i) => {
    if (d > 2) {
      console.log(`  Frame ${i + 1}→${i + 2}: diff=${d.toFixed(1)} ${d > 20 ? '⚠️  SIGNIFICANT FLASH' : '(minor change)'}`);
    }
  });

  if (avgDiff < 1 && highDiffFrames === 0) {
    console.log('\n✅ PASS — Page appears stable, no flashing detected.');
  } else if (highDiffFrames > 3 || maxDiff > 30) {
    console.log('\n❌ FAIL — Significant flashing/instability detected.');
  } else {
    console.log('\n⚠️  WARN — Minor changes detected (possibly normal image loading).');
  }

  await browser.close();
})();

/**
 * code-arena/workers/playwright-runner.js — REAL Playwright Chromium Browser Engine
 * Zero html.includes() fake judging fallbacks. Fails closed with WEB_RUNNER_UNAVAILABLE if Playwright/Chromium is unavailable.
 */
const fs = require('fs');

async function runBrowserEngine() {
    let rawInput = '';
    try {
        rawInput = fs.readFileSync(0, 'utf-8');
    } catch (e) {
        console.log(JSON.stringify({
            success: false,
            verdict: 'SYSTEM_ERROR',
            output: 'Failed to read payload from stdin: ' + e.message,
            stderr: e.message
        }));
        return;
    }

    let payload = {};
    try {
        payload = JSON.parse(rawInput);
    } catch (e) {
        console.log(JSON.stringify({
            success: false,
            verdict: 'SYSTEM_ERROR',
            output: 'Invalid JSON payload: ' + e.message,
            stderr: e.message
        }));
        return;
    }

    const htmlCode = payload.html_code || '';
    const testCases = payload.test_cases || [];

    let chromium = null;
    try {
        const pw = require('playwright');
        chromium = pw.chromium;
    } catch (e) {
        // FAIL CLOSED — Strict mandate: NO html.includes() fake fallback
        console.log(JSON.stringify({
            success: false,
            verdict: 'WEB_RUNNER_UNAVAILABLE',
            output: 'Execution temporarily unavailable. The secure code execution service is currently unavailable. Please try again in a few moments.',
            stderr: 'Playwright dependency missing: ' + e.message
        }));
        return;
    }

    const consoleErrors = [];
    let passedCases = 0;
    const totalCases = testCases.length;
    let finalVerdict = 'ACCEPTED';

    let browser = null;
    let context = null;
    let page = null;

    try {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext();
        page = await context.newPage();

        // Block arbitrary untrusted network access by default
        await page.route('**/*', route => route.abort());

        // Capture console and page runtime errors
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(`Console Error: ${msg.text()}`);
        });
        page.on('pageerror', err => {
            consoleErrors.push(`Runtime Error: ${err.message}`);
        });

        // Set student HTML/CSS/JS content
        await page.setContent(htmlCode, { waitUntil: 'domcontentloaded', timeout: 5000 });

        for (const tc of testCases) {
            const assertion = (tc.expected_output || '').trim();
            let passed = false;

            if (assertion.startsWith('{') && assertion.endsWith('}')) {
                try {
                    const rule = JSON.parse(assertion);
                    const type = rule.type || '';
                    const selector = rule.selector || '';
                    const val = rule.value || rule.expected || '';

                    if (type === 'exists') {
                        const el = await page.$(selector);
                        passed = (el !== null);
                    } else if (type === 'textEquals') {
                        const txt = await page.textContent(selector);
                        passed = (txt && txt.trim() === val.trim());
                    } else if (type === 'textContains') {
                        const txt = await page.textContent(selector);
                        passed = (txt && txt.includes(val));
                    } else if (type === 'attributeEquals') {
                        const attr = await page.getAttribute(selector, rule.attribute || 'value');
                        passed = (attr === val);
                    } else if (type === 'valueEquals') {
                        const valAttr = await page.inputValue(selector);
                        passed = (valAttr === val);
                    } else if (type === 'click') {
                        await page.click(selector, { timeout: 3000 });
                        passed = true;
                    } else if (type === 'fill') {
                        await page.fill(selector, val, { timeout: 3000 });
                        passed = true;
                    } else if (type === 'submit') {
                        await page.evaluate(sel => {
                            const el = document.querySelector(sel);
                            if (el && el.submit) el.submit();
                        }, selector);
                        passed = true;
                    } else if (type === 'waitFor') {
                        await page.waitForSelector(selector, { timeout: 3000 });
                        passed = true;
                    }
                } catch (e) {
                    consoleErrors.push(`Functional Test Exception: ${e.message}`);
                }
            } else {
                if (assertion.startsWith('element:')) {
                    const target = assertion.substring(8).trim();
                    const el = await page.$(target);
                    passed = (el !== null);
                } else if (assertion.startsWith('contains:')) {
                    const text = assertion.substring(9).trim();
                    const bodyTxt = await page.textContent('body');
                    passed = (bodyTxt && bodyTxt.includes(text));
                } else {
                    const bodyTxt = await page.textContent('body');
                    passed = (bodyTxt && bodyTxt.includes(assertion));
                }
            }

            if (passed) {
                passedCases++;
            } else {
                finalVerdict = 'WRONG_ANSWER';
                consoleErrors.push(`DOM assertion failed: ${assertion}`);
                break;
            }
        }
    } catch (err) {
        finalVerdict = (err.name === 'TimeoutError') ? 'TIME_LIMIT_EXCEEDED' : 'SYSTEM_ERROR';
        consoleErrors.push(`Browser Execution Error: ${err.message}`);
    } finally {
        if (page) await page.close().catch(() => {});
        if (context) await context.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
    }

    if (totalCases === 0) passedCases = 1;

    console.log(JSON.stringify({
        success: (finalVerdict === 'ACCEPTED'),
        verdict: finalVerdict,
        passed_test_cases: passedCases,
        total_test_cases: totalCases || 1,
        output: finalVerdict === 'ACCEPTED' ? 'DOM assertions passed in real Playwright Chromium browser context.' : consoleErrors.join('; '),
        stderr: consoleErrors.join('\n')
    }));
}

runBrowserEngine();

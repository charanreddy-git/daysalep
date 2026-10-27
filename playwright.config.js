const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: false,
    workers: 1,
    timeout: 30_000,
    expect: {
        timeout: 5_000
    },
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:4323',
        permissions: ['clipboard-read', 'clipboard-write'],
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'sh tests/start-server.sh',
        url: 'http://127.0.0.1:4323/healthz',
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        env: {
            PORT: '4323',
            RATE_LIMIT_MAX: '1000'
        }
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});

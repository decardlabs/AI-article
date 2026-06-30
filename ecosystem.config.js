module.exports = {
  apps: [{
    name: 'ai-knowledge',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 8000',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '500M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
}

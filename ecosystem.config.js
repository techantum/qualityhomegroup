module.exports = {
  apps: [
    {
      name: "qualityhomegroup",
      script: "node_modules/.bin/next",
      args: "start --port 6002",
      cwd: "/var/www/qualityhomegroup",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 6002,
      },
      error_file: "/var/www/qualityhomegroup/logs/err.log",
      out_file: "/var/www/qualityhomegroup/logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};

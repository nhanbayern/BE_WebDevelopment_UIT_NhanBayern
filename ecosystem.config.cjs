module.exports = {
  apps: [
    {
      name: "ruouongtu-backend",
      script: "./server.js",
      instances: 1,
      exec_mode: "fork",

      // BẮT BUỘC: đường dẫn tuyệt đối
      env_file: "/home/ubuntu/backend/.env",

      env: {
        NODE_ENV: "production"
      },

      max_memory_restart: "500M",
      watch: false
    },
  ],
};

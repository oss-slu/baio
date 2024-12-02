/**
 * @file detect-port.js
 * @description Script for detecting if a specific port (default: 3000) is available and launching the React frontend.
 *
 * Purpose:
 * - Checks if the default port (3000) is available for the application to run.
 * - If the port is unavailable, it automatically switches to the next available port.
 * - Launches the React frontend application (`react-scripts start`) on the available port.
 *
 * Key Functions:
 * - `detect`: Uses the `detect-port` library to check if the default port is available.
 * - `exec`: Uses `child_process.exec` to run the `react-scripts start` command to start the React app on the detected port.
 *
 * Usage:
 * - Run this script before starting the React application to ensure it runs on an available port.
 * - This script is especially useful for development environments where multiple apps or services may be running.
 *
 * Dependencies:
 * - `detect-port`: A library to detect if a port is available.
 * - `child_process`: Node.js module used to spawn new processes and run commands.
 */

const detect = require('detect-port');

const DEFAULT_PORT = 3000;

detect(DEFAULT_PORT, (err, availablePort) => {
  if (err) {
    console.log(`Error detecting port: ${err.message}`);
    process.exit(1);
  }

  if (DEFAULT_PORT === availablePort) {
    console.log(`Port ${DEFAULT_PORT} is available`);
    process.env.PORT = DEFAULT_PORT;
  } else {
    console.log(`Port ${DEFAULT_PORT} is occupied, switching to port ${availablePort}`);
    process.env.PORT = availablePort;
  }

  const { exec } = require('child_process');
  exec('react-scripts start', (err, stdout, stderr) => {
    if (err) {
      console.error(`Error starting frontend: ${err.message}`);
      return;
    }
    console.log(stdout);
    console.error(stderr);
  });
});

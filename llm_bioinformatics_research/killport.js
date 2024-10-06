const { exec } = require('child_process');

const killPort = (port) => {
  let command;

  if (process.platform === 'win32') {
    // Using native Windows commands to filter and kill processes on the given port
    command = `for /F "tokens=5" %a in ('netstat -aon ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F`;
  } else {
    // Unix-like command to kill processes using the given port
    command = `lsof -ti :${port} | xargs kill -9`;
  }

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

process.argv.slice(2).forEach(killPort);

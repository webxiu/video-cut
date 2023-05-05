const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// utils
module.exports = {
  spawn(ffmpegPath, command) {
    return new Promise((resolve, reject) => {
      const cp = spawn(ffmpegPath, [...command], { stdio: "inherit" });
      cp.on("data", (data) => resolve({ type: "data", data }));
      cp.on("error", (err) => reject({ type: "error", err }));
      cp.on("close", (code, signal) => {
        let timer = setTimeout(() => {
          resolve({ type: "close", code, signal });
          clearTimeout(timer);
        }, 1000);
      });
    });
  },
  getFilePath(rootPath) {
    const filePaths = [];
    const findJsonFile = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((name) => {
        const fPath = path.join(dir, name);
        const stat = fs.statSync(fPath);
        if (stat.isDirectory()) {
          findJsonFile(fPath);
        } else if (stat.isFile()) {
          filePaths.push(fPath);
        }
      });
    };
    findJsonFile(rootPath);
    return filePaths;
  },
  fillZero(value, num = 2) {
    return `${value}`.padStart(num, 0);
  },
  getNowTime() {
    let now = new Date();
    let year = now.getFullYear(); //获取完整的年份(4位,1970-????)
    let month = now.getMonth() + 1; //获取当前月份(0-11,0代表1月)
    let today = now.getDate(); //获取当前日(1-31)
    let hour = now.getHours(); //获取当前小时数(0-23)
    let minute = now.getMinutes(); //获取当前分钟数(0-59)
    let second = now.getSeconds(); //获取当前秒数(0-59)
    let nowTime = "";
    nowTime = `${year}${this.fillZero(month)}${this.fillZero(today)}${this.fillZero(hour)}${this.fillZero(minute)}${this.fillZero(second)}`;
    return nowTime;
  },
  randomRange(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min);
  },
};

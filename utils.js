const fs = require("fs");
const path = require("path");
const minimist = require("minimist");
const config = require("./config");
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
  /**
   * 获取目录下的所有文件路径
   * @param {string} rootPath 扫描目录
   * @param {Array<string>} suffixs 包含格式
   * @returns 路径列表
   */
  getFilePath(rootPath, suffixs = [".mp4"]) {
    const filePaths = [];
    const findJsonFile = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach((name) => {
        const fPath = path.join(dir, name);
        const ext = path.extname(fPath);
        const stat = fs.statSync(fPath);
        if (stat.isDirectory()) {
          findJsonFile(fPath);
        } else if (stat.isFile() && suffixs.includes(ext)) {
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
  // 获取路径
  getParams() {
    const args = minimist(process.argv.slice(2));
    const inputDir = args["inputPath"] || config.inputPath; // 输入路径
    const outputDir = args["outPath"] || config.outputDir; // 输出路径
    const logoPath = args["logoPath"] || config.logoPath; // logo路径
    const endPath = args["endPath"] || config.endPath; // 片尾路径
    const min = args["minLength"] || config.minLength; // 随机截最小时间
    const max = args["maxLength"] || config.maxLength; // 随机截最大时间
    const limit = args["minLimit"] || config.minLimit; // 低于限制时间， 视频截取不保留

    return { inputDir, outputDir, logoPath, endPath, min, max, limit };
  },
};

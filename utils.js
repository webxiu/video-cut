const fs = require("fs");
const path = require("path");
const minimist = require("minimist");
const config = require("./config");
const { spawn, exec } = require("child_process");

// utils
module.exports = {
  spawn(ffmpegPath, command, delay = 1000) {
    const cmd = command.split(" ");
    console.log("\n====命令=====>:", command, "\n\n");
    return new Promise((resolve, reject) => {
      const cp = spawn(ffmpegPath, [...cmd], { stdio: "inherit" });
      cp.on("data", (data) => resolve({ type: "data", data }));
      cp.on("error", (err) => reject({ type: "error", err }));
      cp.on("close", (code, signal) => {
        let timer = setTimeout(() => {
          resolve({ type: "close", code, signal });
          clearTimeout(timer);
        }, delay);
      });
    });
  },
  exec(ffmpegPath, command) {
    return new Promise((resolve, reject) => {
      exec(`${ffmpegPath} ${command}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error}`);
          reject({ type: "error", error });
          return;
        }
        resolve({ type: "stdout", stdout, stderr });
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
    });
  },
  getFileInfo(ffprobePath, pathFile) {
    return new Promise((resolve, reject) => {
      const cmd = `${ffprobePath} -i ${pathFile} -v quiet -print_format json -show_format -show_streams`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error}`);
          console.error(`stderr: ${stderr}`);
          reject({ type: "error", error, stderr });
          return;
        }
        resolve(JSON.parse(stdout));
      });
    });
  },
  /**
   * 获取视频时长
   * @param {string} ffprobePath ffprobe路径
   * @param {string} pathFile 文件路径
   * @returns 时长
   */
  execGetSec(ffprobePath, pathFile) {
    return new Promise((resolve) => {
      const cmd = `${ffprobePath} -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 ${pathFile}`;
      exec(cmd, (err, stdout, stderr) => {
        if (!err) {
          resolve(parseInt(stdout));
        } else {
          resolve(0);
        }
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
    const endPath = args["endPath"] || config.endPath; // 片尾路径
    const audioPath = args["audioPath"] || config.audioPath; // 片尾路径
    const logoPath = args["logoPath"] || config.logoPath; // 水印logo路径
    const coverTitle = args["coverTitle"] || config.coverTitle; // 水印logo路径
    const sticker = args["sticker"] || config.sticker; // mov贴纸
    const cover = args["cover"] || config.cover; // 封面
    const min = args["minLength"] || config.minLength; // 随机截最小时间
    const max = args["maxLength"] || config.maxLength; // 随机截最大时间
    const limit = args["minLimit"] || config.minLimit; // 低于限制时间， 视频截取不保留
    const split = args["split"] || config.split; // 低于限制时间， 视频截取不保留
    const scale = args["scale"] || config.scale; // 低于限制时间， 视频截取不保留

    return { inputDir, outputDir, endPath, audioPath, logoPath, coverTitle, sticker, cover, min, max, limit, split, scale };
  },
};

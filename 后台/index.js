// 获取express对象
const express = require("express");
// 服务器对象
const app = express();
const fs = require("fs");
var http = require('http');
const Multiparty = require('multiparty');
// 用于调用ffmpeg
const ffmpeg = require("fluent-ffmpeg");
// 用于加密转码
const crypto = require('crypto');

// 讯飞应用 id
const Appid="xxx";
// 讯飞应用密钥
const ApiKey="xxx";


// 将语音变为文字+语义识别
app.post("/smart_order", (req, res) => {
  // 保存微信录音
  var form = new Multiparty.Form();
  form.parse(req, function (err, fields, files) {
    // wx_record 字段为在小程序 上传方法中定义的name参数
    let file = files.wx_record[0];
    // 处理文件路径
    var newPath = "uploads/" + file.originalFilename.slice(0, file.originalFilename.indexOf(".")) + ".wav";
    // 转换录音格式
    ffmpeg()
      .addInput(file.path)
      // 保存到新路径
      .save(newPath)
      .on("error", (err) => {
        console.log(err);
      })
      .on("end", () => {
        // 转换成功 调用讯飞语音进行识别
        xf_recogn(newPath, res);
      });
  });

  // res.end("欢迎登录");
});

// 将语音变为文字+语义识别
let xf_recogn = function (filePath, httpRes) {
//#region  构建 讯飞语音需要的参数
  var timestamp = Date.parse(new Date());
  var curTime = timestamp / 1000;
  var xParam = { "auf": "16k", "aue": "raw", "scene": "main", "userid": Appid }
  xParam = JSON.stringify(xParam);
  var xParamBase64 = new Buffer(xParam).toString('base64');

  //音频文件
  var fileData = fs.readFileSync(filePath);
  var fileBase64 = new Buffer(fileData).toString('base64');
  var bodyData = "data=" + fileBase64;

  var token = ApiKey + curTime + xParamBase64 + bodyData;
  const hash = crypto.createHash('md5');
  hash.update(token);
  var xCheckSum = hash.digest('hex');
  var options = {
    hostname: 'api.xfyun.cn',
    port: 80,
    path: '/v1/aiui/v1/voice_semantic',
    method: 'POST',
    headers: {
      "X-Appid": Appid,
      "X-CurTime": curTime,
      "X-Param": xParamBase64,
      "X-CheckSum": xCheckSum,
      "userid": Appid,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  };
  //#endregion
  var datas = [];
  var req = http.request(options, function (res) {
    res.setEncoding('utf-8');
    datas = [];
    res.on('data', function (rersult) {
      datas.push(rersult);
    });
    res.on('end', function () {
    //  接收讯飞回调 
      var result = JSON.parse(datas.join(''));
      if (result.code == "00000") {
        httpRes.end(JSON.stringify(result.data));
      } else {
        console.log("讯飞接口识别录音错误" + result.code);
        httpRes.end(result.desc);
      }
    });
  });
  req.on('error', function (err) {
    console.log("发送到讯飞语音接口失败");
    console.error(err);
  });
  req.write(bodyData);
  req.end();
}

var server = app.listen(3005, () => {
  let port = server.address().port;
  let address = server.address().address;
  console.log(`服务开启成功 ${address} ${port}`);
});
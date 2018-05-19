// 获取微信录音管理器
const recordManager = wx.getRecorderManager(); 
// 后台 接口地址 
const WX_API = "http://ip:3005/smart_order";

// 当前页面对象
let MyPage;
  
// 录音结束时触发 
recordManager.onStop((result) => {
  console.log("录音结束");
  // 获取录音路径
  let { tempFilePath } = result;

  // 发送录音文件到后台
  wx.uploadFile({
    url: WX_API,
    method: "post",
    filePath: tempFilePath,
    name: "wx_record",
    success(ret) {
      console.log("录音发送到后台成功");
      // 成功返回讯飞语音识别结果  结果格式 可以参考 xJson文件内的文件 
      let serviceData = JSON.parse(ret.data);
    
      // 将文本打印到页面上 
      MyPage.setData({ yourMsg: serviceData.text });
      
      // 一些错误处理 
      if (!serviceData.answer || !serviceData.answer.text) {
        sayWords("你好帅 你在说什么");
        return;
      }

      // 将文本打印到页面上 
      let returnMsg = serviceData.answer.text;
      MyPage.setData({ revices: returnMsg });

      // 根据讯飞返回的服务类型  采取措施
      switch (serviceData.service) {
        case "weather":
          // 集成天气
          // 调用语音播放
          sayWords(returnMsg);
          console.log("天气"+returnMsg);
          break;
        case "baike":
          // 集成百科
          // 调用语音播放
          sayWords(returnMsg);
          console.log("百科"+returnMsg);
          break;
        case "radio":
          // 集成电台 调用 微信小程序内的组件进行播放
          var resultArr = serviceData.data.result;
          var tmpUrl = resultArr[0].url;
          console.log("电台 "+tmpUrl);
          MyPage.audioCtx.setSrc(tmpUrl);
          MyPage.audioCtx.play();
          break;
        case "joke":
          // 集成笑话
          var resultArr = serviceData.data.result;
          var joke1 = resultArr[0].content;
          console.log("笑话"+joke1);
          sayWords(joke1);
          break;
        default:
          break;
      }
    },
    fail(err) {
      console.log("录音发送到后台失败");
      console.log(err);
    }
  })
});

// 把文字变成语音念出来
function sayWords(msg) {
  msg = msg.replace(/"/g, '');
  // 图简单 直接粗暴的调用 百度的语音播放接口，该接口直接传文本即可
  // 正确的用法 也需要 调用 讯飞或者百度的语音接口，需要 注册 传入 appid的种。。
  var xfurl = `http://tts.baidu.com/text2audio?idx=1&tex='${msg}'&cuid=baidu_speech_demo&cod=2&lan=zh&ctp=1&pdt=1&spd=3&per=2&vol=9&pit=5`;
  MyPage.audioCtx.setSrc(xfurl);
  MyPage.audioCtx.play();
}
Page({
  /**
   * 页面的初始数据
   */
  data: {
    yourMsg: "",
    revices: ""
  },
  sayStartHandel() {
    // 暂停正在播放的所有语音 
    this.audioCtx.pause();
    // 开始录音
    recordManager.start({
    });
  },
  sayStopHandel() {
    //  结束录音
    recordManager.stop({});
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    MyPage = getCurrentPages()[0];
    this.audioCtx = wx.createAudioContext('myAudio');
  },
})
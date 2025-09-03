// app.js
const config = require("./config.js");

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloud1-3gsj5l6ga9920687', // 确保此环境ID在云开发控制台中存在
        traceUser: true,
      });
    }

    // 安全地获取系统信息
    try {
      const systemInfo = wx.getSystemInfoSync();
      const SCREEN_WIDTH = 750;
      const RATE = systemInfo.windowHeight / systemInfo.windowWidth;
      this.globalData.windowHeight = SCREEN_WIDTH * RATE;
    } catch (e) {
      console.error('获取系统信息失败:', e);
      this.globalData.windowHeight = 1000; // 设置默认值
    }

    // 初始化全局配置
    this.globalData.apiUrl = config.domain;
    this.globalData.appKey = config.alianceKey;
    this.globalData.imageUrl = config.qiniuDomain+"/";
    this.globalData.bgIimage = config.bgImage;
    
    this.globalData.reloadSale = false;
    this.globalData.reloadHome = false;
    this.globalData.param = false;
    this.globalData.authStatus = false;
  },

  globalData: {
    appId:null,
    userInfo: null,
    apiUrl: null,
    color: '0aecc3',
    imageUrl:'',
    bgImage:'',
    changeSchoolPost:false,
    changeSchoolSale: false,
    changeSchoolMatch: false,
    postHelp:false,
    reloadSale:false,
    reloadHome:false,
    param:false,
    authStatus:false,
    windowHeight: 1000  // 默认值
  }
});
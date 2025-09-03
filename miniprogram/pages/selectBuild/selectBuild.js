// pages/selectBuild/selectBuild.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
      tabList: ['栖霞校区宿舍', '江宁校区宿舍', "实训大楼", '博远楼', '博雅楼', '图书馆'],
      tabNow: 0
  },

  selectBuild(e) {
      const index = e.currentTarget.dataset.index;
      const that = this.data;
      const build = `${that.tabList[that.tabNow]}-${index + 1}号楼`;
      wx.navigateTo({
        url: `../addAddress/addAddress?build=${build}`
      })
  },

  selectTab(e) {
      const id = e.currentTarget.dataset.id;
      this.setData({
          tabNow: id,
      })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
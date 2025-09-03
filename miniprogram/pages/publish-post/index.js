// pages/publish-post/index.js
const app = getApp();
const db = wx.cloud.database();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 帖子标题
    title: '',
    // 帖子内容
    content: '',
    // 已选择的图片列表
    imageList: [],
    // 分类列表
    categories: [
      { id: 'help', name: '求助' },
      { id: 'idle', name: '闲置' },
      { id: 'chat', name: '吐槽' },
      { id: 'notice', name: '通知' }
    ],
    // 已选择的分类
    selectedCategory: 'help',
    // 是否正在提交
    submitting: false,
    // 标题最大长度
    titleMaxLength: 50,
    // 内容最大长度
    contentMaxLength: 2000
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
  },

  /**
   * 输入标题
   * @param {Object} e - 事件对象
   */
  onInputTitle: function (e) {
    this.setData({
      title: e.detail.value
    });
  },

  /**
   * 输入内容
   * @param {Object} e - 事件对象
   */
  onInputContent: function (e) {
    this.setData({
      content: e.detail.value
    });
  },

  /**
   * 选择分类
   * @param {Object} e - 事件对象
   */
  onSelectCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      selectedCategory: categoryId
    });
  },

  /**
   * 选择图片
   */
  chooseImage: function () {
    const { imageList } = this.data;
    const remainCount = 9 - imageList.length;
    
    if (remainCount <= 0) {
      wx.showToast({
        title: '最多只能上传9张图片',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 更新图片列表
        this.setData({
          imageList: [...imageList, ...res.tempFilePaths]
        });
      }
    });
  },

  /**
   * 预览图片
   * @param {Object} e - 事件对象
   */
  previewImage: function (e) {
    const { current } = e.currentTarget.dataset;
    wx.previewImage({
      current,
      urls: this.data.imageList
    });
  },

  /**
   * 删除图片
   * @param {Object} e - 事件对象
   */
  deleteImage: function (e) {
    const { index } = e.currentTarget.dataset;
    const { imageList } = this.data;
    imageList.splice(index, 1);
    this.setData({ imageList });
  },

  /**
   * 上传图片到云存储
   * @returns {Promise<Array>} 上传后的图片URL数组
   */
  uploadImages: async function () {
    const { imageList } = this.data;
    if (imageList.length === 0) return [];
    
    const uploadTasks = imageList.map((filePath, index) => {
      const cloudPath = `forum/${Date.now()}_${index}.${filePath.match(/\.(\w+)$/)[1]}`;
      return wx.cloud.uploadFile({
        cloudPath,
        filePath
      });
    });
    
    try {
      const uploadResults = await Promise.all(uploadTasks);
      return uploadResults.map(result => result.fileID);
    } catch (err) {
      console.error('上传图片失败', err);
      throw new Error('上传图片失败');
    }
  },

  /**
   * 发布帖子
   */
  publishPost: async function () {
    // 表单验证
    const { title, content, selectedCategory } = this.data;
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return;
    }
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    
    // 开始提交
    this.setData({ submitting: true });
    
    try {
      // 1. 上传图片
      wx.showLoading({ title: '上传图片中...' });
      const imageFileIDs = await this.uploadImages();
      
      // 2. 调用云函数发布帖子
      wx.showLoading({ title: '发布中...' });
      const userInfo = wx.getStorageSync('userInfo');
      
      // 生成摘要（取内容前100个字符）
      const summary = content.substring(0, 100).replace(/[\r\n]/g, ' ');
      
      const result = await wx.cloud.callFunction({
        name: 'addPost',
        data: {
          title,
          content,
          category: selectedCategory,
          categoryName: this.data.categories.find(cat => cat.id === selectedCategory)?.name || '',
          images: imageFileIDs
        }
      });
      
      wx.hideLoading();
      
      if (result.result && result.result.success) {
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      } else {
        const errorMsg = result.result?.error || '发布失败';
        console.error('发布帖子失败:', result.result);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('发布帖子失败', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '发布失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 取消发布
   */
  cancelPublish: function () {
    wx.navigateBack();
  }
})
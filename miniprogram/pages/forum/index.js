// pages/forum/index.js
const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 帖子列表数据
    postsList: [],
    // 分类标签数据
    categories: [
      { id: 'all', name: '全部' },
      { id: 'help', name: '求助' },
      { id: 'idle', name: '闲置' },
      { id: 'chat', name: '吐槽' },
      { id: 'notice', name: '通知' }
    ],
    // 当前选中的分类
    currentCategory: 'all',
    // 分页相关
    pageSize: 10,
    pageNum: 0,
    // 是否还有更多数据
    hasMoreData: true,
    // 加载状态
    loading: false,
    // 下拉刷新状态
    refreshing: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载帖子列表
    this.loadPostsList(true);
  },

  /**
   * 切换分类标签
   * @param {Object} e - 事件对象
   */
  switchCategory: function (e) {
    const categoryId = e.currentTarget.dataset.id;
    if (categoryId === this.data.currentCategory) return;
    
    this.setData({
      currentCategory: categoryId,
      postsList: [],
      pageNum: 0,
      hasMoreData: true
    });
    
    // 重新加载帖子列表
    this.loadPostsList(true);
  },

  /**
   * 加载帖子列表
   * @param {Boolean} refresh - 是否刷新列表
   */
  loadPostsList: function (refresh = false) {
    if (this.data.loading || (!this.data.hasMoreData && !refresh)) return;
    
    this.setData({ loading: true });
    
    // 如果是刷新，重置页码
    if (refresh) {
      this.setData({
        pageNum: 0,
        postsList: []
      });
    }
    
    // 构建查询条件
    const query = {};
    if (this.data.currentCategory !== 'all') {
      query.category = this.data.currentCategory;
    }
    
    // 调用云函数获取帖子列表
    wx.cloud.callFunction({
      name: 'getPostList',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        category: this.data.currentCategory
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const { posts, total } = res.result;
        
        // 计算是否还有更多数据
        const hasMoreData = this.data.pageNum * this.data.pageSize + posts.length < total;
        
        // 更新数据
        this.setData({
          postsList: [...this.data.postsList, ...posts],
          pageNum: this.data.pageNum + 1,
          hasMoreData,
          loading: false,
          refreshing: false
        });
      } else {
        throw new Error(res.result?.error || '获取帖子列表失败');
      }
    }).catch(err => {
      console.error('加载帖子列表失败', err);
      this.setData({
        loading: false,
        refreshing: false
      });
      wx.showToast({
        title: err.message || '加载失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 处理点赞事件
   * @param {Object} e - 事件对象
   */
  handleLike: function (e) {
    const { postId } = e.detail;
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 调用云函数点赞/取消点赞
    wx.cloud.callFunction({
      name: 'likePost',
      data: {
        postId
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const { liked, likes } = res.result;
        
        // 更新本地数据
        const postsList = this.data.postsList.map(post => {
          if (post._id === postId) {
            return {
              ...post,
              isLiked: liked,
              likes
            };
          }
          return post;
        });
        
        this.setData({ postsList });
        
        wx.showToast({
          title: liked ? '点赞成功' : '取消点赞',
          icon: 'success'
        });
      } else {
        throw new Error(res.result?.error || '点赞操作失败');
      }
    }).catch(err => {
      console.error('点赞操作失败', err);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 处理评论事件
   * @param {Object} e - 事件对象
   */
  handleComment: function (e) {
    const { postId } = e.detail;
    wx.navigateTo({
      url: '/pages/post-detail/index?id=' + postId + '&focus=comment'
    });
  },

  /**
   * 跳转到帖子详情页
   * @param {Object} e - 事件对象
   */
  navigateToDetail: function (e) {
    const { postId } = e.detail;
    wx.navigateTo({
      url: '/pages/post-detail/index?id=' + postId
    });
  },

  /**
   * 跳转到发布帖子页面
   */
  navigateToPublish: function () {
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/publish-post/index'
    });
  },

  /**
   * 跳转到搜索页面
   */
  navigateToSearch: function () {
    wx.navigateTo({
      url: '/pages/forum-search/index'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({ refreshing: true });
    this.loadPostsList(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.hasMoreData && !this.data.loading) {
      this.loadPostsList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '校园论坛 - 分享校园生活',
      path: '/pages/forum/index'
    };
  }
});
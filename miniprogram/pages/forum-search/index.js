// pages/forum-search/index.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 搜索关键词
    keyword: '',
    // 搜索结果列表
    searchResults: [],
    // 搜索历史
    searchHistory: [],
    // 热门搜索
    hotKeywords: [
      '求助', '闲置', '二手', '兼职', '拼车', '失物', '表白'
    ],
    // 是否正在搜索
    searching: false,
    // 是否显示搜索结果
    showResults: false,
    // 分页相关
    pageSize: 10,
    pageNum: 0,
    // 是否还有更多数据
    hasMoreData: true,
    // 加载状态
    loading: false,
    // 搜索框焦点状态
    inputFocus: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 加载搜索历史
    this.loadSearchHistory();
    
    // 如果有传入的关键词，直接搜索
    if (options.keyword) {
      this.setData({
        keyword: options.keyword
      });
      this.performSearch();
    }
  },

  /**
   * 加载搜索历史
   */
  loadSearchHistory: function () {
    const searchHistory = wx.getStorageSync('forum_search_history') || [];
    this.setData({
      searchHistory: searchHistory.slice(0, 10) // 最多显示10条历史
    });
  },

  /**
   * 保存搜索历史
   */
  saveSearchHistory: function (keyword) {
    if (!keyword.trim()) return;
    
    let searchHistory = wx.getStorageSync('forum_search_history') || [];
    
    // 移除重复项
    searchHistory = searchHistory.filter(item => item !== keyword);
    
    // 添加到开头
    searchHistory.unshift(keyword);
    
    // 限制数量
    if (searchHistory.length > 20) {
      searchHistory = searchHistory.slice(0, 20);
    }
    
    wx.setStorageSync('forum_search_history', searchHistory);
    this.loadSearchHistory();
  },

  /**
   * 清空搜索历史
   */
  clearSearchHistory: function () {
    wx.showModal({
      title: '提示',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('forum_search_history');
          this.setData({
            searchHistory: []
          });
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 输入搜索关键词
   */
  onInputKeyword: function (e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  /**
   * 点击搜索按钮
   */
  onSearchTap: function () {
    this.performSearch();
  },

  /**
   * 点击热门关键词或历史记录
   */
  onKeywordTap: function (e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      keyword
    });
    this.performSearch();
  },

  /**
   * 执行搜索
   */
  performSearch: function () {
    const keyword = this.data.keyword.trim();
    
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    // 保存搜索历史
    this.saveSearchHistory(keyword);
    
    // 重置搜索结果
    this.setData({
      searchResults: [],
      pageNum: 0,
      hasMoreData: true,
      showResults: true
    });
    
    // 执行搜索
    this.searchPosts(true);
  },

  /**
   * 搜索帖子
   * @param {Boolean} refresh - 是否刷新列表
   */
  searchPosts: function (refresh = false) {
    if (this.data.loading || (!this.data.hasMoreData && !refresh)) return;
    
    this.setData({ 
      loading: true,
      searching: refresh
    });
    
    // 如果是刷新，重置页码
    if (refresh) {
      this.setData({
        pageNum: 0,
        searchResults: []
      });
    }
    
    // 调用云函数搜索
    wx.cloud.callFunction({
      name: 'getPostList',
      data: {
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        keyword: this.data.keyword
      }
    }).then(res => {
      const { posts, total } = res.result;
      
      // 计算是否还有更多数据
      const hasMoreData = this.data.pageNum * this.data.pageSize + posts.length < total;
      
      // 更新数据
      this.setData({
        searchResults: [...this.data.searchResults, ...posts],
        pageNum: this.data.pageNum + 1,
        hasMoreData,
        loading: false,
        searching: false
      });
    }).catch(err => {
      console.error('搜索失败', err);
      this.setData({
        loading: false,
        searching: false
      });
      wx.showToast({
        title: '搜索失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 处理点赞事件
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
    
    wx.cloud.callFunction({
      name: 'likePost',
      data: {
        postId
      }
    }).then(res => {
      const { liked, likes } = res.result;
      
      // 更新本地数据
      const searchResults = this.data.searchResults.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            isLiked: liked,
            likes
          };
        }
        return post;
      });
      
      this.setData({ searchResults });
      
      wx.showToast({
        title: liked ? '点赞成功' : '取消点赞',
        icon: 'success'
      });
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
   */
  handleComment: function (e) {
    const { postId } = e.detail;
    wx.navigateTo({
      url: '/pages/post-detail/index?id=' + postId + '&focus=comment'
    });
  },

  /**
   * 跳转到帖子详情页
   */
  navigateToDetail: function (e) {
    const { postId } = e.detail;
    wx.navigateTo({
      url: '/pages/post-detail/index?id=' + postId
    });
  },

  /**
   * 返回上一页
   */
  navigateBack: function () {
    wx.navigateBack();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.showResults && this.data.hasMoreData && !this.data.loading) {
      this.searchPosts();
    }
  }
});
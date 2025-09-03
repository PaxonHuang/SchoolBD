// pages/post-detail/index.js
const app = getApp();
const db = wx.cloud.database();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 帖子ID
    postId: '',
    // 帖子详情
    postDetail: null,
    // 评论列表
    commentList: [],
    // 评论内容
    commentContent: '',
    // 评论框焦点
    commentFocus: false,
    // 回复对象
    replyTo: null,
    // 分页相关
    pageSize: 20,
    pageNum: 0,
    // 是否还有更多评论
    hasMoreComments: true,
    // 加载状态
    loading: false,
    // 评论加载状态
    loadingComments: false,
    // 是否正在提交评论
    submittingComment: false,
    // 评论最大长度
    commentMaxLength: 500
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { id, focus } = options;
    
    this.setData({
      postId: id,
      commentFocus: focus === 'comment'
    });
    
    // 加载帖子详情
    this.loadPostDetail();
    
    // 加载评论列表
    this.loadCommentList(true);
  },

  /**
   * 加载帖子详情
   */
  loadPostDetail: function () {
    const { postId } = this.data;
    
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'getPostDetail',
      data: {
        postId
      }
    }).then(res => {
      const { post } = res.result;
      
      if (post) {
        this.setData({
          postDetail: post,
          loading: false
        });
      } else {
        wx.showToast({
          title: '帖子不存在或已删除',
          icon: 'none',
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }
        });
      }
    }).catch(err => {
      console.error('加载帖子详情失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 加载评论列表
   * @param {Boolean} refresh - 是否刷新列表
   */
  loadCommentList: function (refresh = false) {
    const { postId, pageNum, pageSize, loadingComments } = this.data;
    
    if (loadingComments) return;
    
    this.setData({ loadingComments: true });
    
    // 如果是刷新，重置页码
    if (refresh) {
      this.setData({
        pageNum: 0,
        commentList: []
      });
    }
    
    wx.cloud.callFunction({
      name: 'getComments',
      data: {
        postId,
        pageNum: this.data.pageNum,
        pageSize
      }
    }).then(res => {
      console.log('getComments 返回结果:', res);
      
      if (res.result && res.result.success) {
        const { comments = [], total = 0 } = res.result;
        
        // 计算是否还有更多评论
        const hasMoreComments = this.data.pageNum * pageSize + comments.length < total;
        
        // 更新数据
        this.setData({
          commentList: [...this.data.commentList, ...comments],
          pageNum: this.data.pageNum + 1,
          hasMoreComments,
          loadingComments: false
        });
      } else {
        // 如果没有返回 success，但有数据，尝试兼容处理
        const comments = res.result?.comments || [];
        const total = res.result?.total || 0;
        
        const hasMoreComments = this.data.pageNum * pageSize + comments.length < total;
        
        this.setData({
          commentList: [...this.data.commentList, ...comments],
          pageNum: this.data.pageNum + 1,
          hasMoreComments,
          loadingComments: false
        });
      }
    }).catch(err => {
      console.error('加载评论列表失败', err);
      this.setData({ loadingComments: false });
      wx.showToast({
        title: '加载评论失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 输入评论内容
   * @param {Object} e - 事件对象
   */
  onInputComment: function (e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  /**
   * 聚焦评论框
   */
  focusCommentInput: function () {
    this.setData({
      commentFocus: true,
      replyTo: null
    });
  },

  /**
   * 回复评论
   * @param {Object} e - 事件对象
   */
  replyComment: function (e) {
    const { commentId, author } = e.detail;
    
    this.setData({
      commentFocus: true,
      replyTo: {
        commentId,
        author
      },
      commentContent: `回复 @${author.nickName}：`
    });
  },

  /**
   * 提交评论
   */
  submitComment: function () {
    const { commentContent, postId, replyTo, submittingComment } = this.data;
    
    // 验证评论内容
    if (!commentContent.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }
    
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 防止重复提交
    if (submittingComment) return;
    
    this.setData({ submittingComment: true });
    
    // 调用云函数添加评论
    wx.cloud.callFunction({
      name: 'addComment',
      data: {
        postId,
        content: commentContent,
        replyTo: replyTo ? replyTo.commentId : null
      }
    }).then(res => {
      if (res.result && res.result.success) {
        // 清空评论内容
        this.setData({
          commentContent: '',
          replyTo: null,
          submittingComment: false
        });
        
        // 重新加载评论列表
        this.loadCommentList(true);
        
        // 更新帖子评论数
        if (this.data.postDetail) {
          const postDetail = { ...this.data.postDetail };
          postDetail.comments = (postDetail.comments || 0) + 1;
          this.setData({ postDetail });
        }
        
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });
      } else {
        throw new Error('评论失败');
      }
    }).catch(err => {
      console.error('提交评论失败', err);
      this.setData({ submittingComment: false });
      wx.showToast({
        title: '评论失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 点赞/取消点赞
   */
  toggleLike: function () {
    const { postId, postDetail } = this.data;
    
    // 检查用户是否已登录
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
      const { liked, likes } = res.result;
      
      // 更新本地数据
      if (postDetail) {
        const updatedPostDetail = { ...postDetail };
        updatedPostDetail.isLiked = liked;
        updatedPostDetail.likes = likes;
        this.setData({ postDetail: updatedPostDetail });
      }
      
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
   * 收藏/取消收藏
   */
  toggleCollect: function () {
    const { postId, postDetail } = this.data;
    
    // 检查用户是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    // 调用云函数收藏/取消收藏
    wx.cloud.callFunction({
      name: 'collectPost',
      data: {
        postId
      }
    }).then(res => {
      const { collected } = res.result;
      
      // 更新本地数据
      if (postDetail) {
        const updatedPostDetail = { ...postDetail };
        updatedPostDetail.isCollected = collected;
        this.setData({ postDetail: updatedPostDetail });
      }
      
      wx.showToast({
        title: collected ? '收藏成功' : '取消收藏',
        icon: 'success'
      });
    }).catch(err => {
      console.error('收藏操作失败', err);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    });
  },

  /**
   * 预览图片
   * @param {Object} e - 事件对象
   */
  previewImage: function (e) {
    const { src, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: src,
      urls: urls
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
    if (this.data.hasMoreComments && !this.data.loadingComments) {
      this.loadCommentList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const { postDetail } = this.data;
    return {
      title: postDetail ? postDetail.title : '校园论坛帖子分享',
      path: '/pages/post-detail/index?id=' + this.data.postId
    };
  }
})
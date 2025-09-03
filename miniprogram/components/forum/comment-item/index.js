// components/forum/comment-item/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    comment: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 是否显示全部内容
    showFull: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 切换显示全部/部分内容
     */
    toggleShowFull: function() {
      this.setData({
        showFull: !this.data.showFull
      });
    },

    /**
     * 点击评论
     */
    onTapComment: function() {
      const { comment } = this.properties;
      this.triggerEvent('tapcomment', {
        commentId: comment._id,
        author: comment.author
      });
    },

    /**
     * 点赞评论
     */
    onLikeComment: function(e) {
      // 阻止冒泡
      e.stopPropagation();
      
      const { comment } = this.properties;
      
      // 检查用户是否已登录
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      // 调用云函数点赞/取消点赞评论
      wx.cloud.callFunction({
        name: 'likeComment',
        data: {
          commentId: comment._id
        }
      }).then(res => {
        const { liked, likes } = res.result;
        
        // 更新本地数据
        const updatedComment = { ...comment };
        updatedComment.isLiked = liked;
        updatedComment.likes = likes;
        this.setData({
          'comment': updatedComment
        });
      }).catch(err => {
        console.error('点赞评论失败', err);
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none'
        });
      });
    },

    /**
     * 预览图片
     */
    previewImage: function(e) {
      const { src, urls } = e.currentTarget.dataset;
      wx.previewImage({
        current: src,
        urls: urls
      });
    }
  }
})
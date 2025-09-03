// components/forum/post-card/index.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 帖子数据
    post: {
      type: Object,
      value: {}
    },
    // 是否显示完整内容
    showFullContent: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 格式化后的时间
    formattedTime: ''
  },

  /**
   * 数据监听器
   */
  observers: {
    'post.createTime': function(createTime) {
      if (createTime) {
        this.formatTimeStamp(createTime);
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 格式化时间戳为友好显示
     * @param {String|Number} timestamp - 时间戳
     */
    formatTimeStamp: function(timestamp) {
      let date;
      
      // 处理字符串格式的时间戳或Date对象
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(Number(timestamp));
      }
      
      const now = new Date();
      const diff = now - date; // 时间差（毫秒）
      
      // 小于1分钟
      if (diff < 60 * 1000) {
        this.setData({
          formattedTime: '刚刚'
        });
        return;
      }
      
      // 小于1小时
      if (diff < 60 * 60 * 1000) {
        this.setData({
          formattedTime: Math.floor(diff / (60 * 1000)) + '分钟前'
        });
        return;
      }
      
      // 小于24小时
      if (diff < 24 * 60 * 60 * 1000) {
        this.setData({
          formattedTime: Math.floor(diff / (60 * 60 * 1000)) + '小时前'
        });
        return;
      }
      
      // 小于30天
      if (diff < 30 * 24 * 60 * 60 * 1000) {
        this.setData({
          formattedTime: Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前'
        });
        return;
      }
      
      // 大于30天，显示具体日期
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      this.setData({
        formattedTime: `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`
      });
    },
    
    /**
     * 点击帖子卡片
     */
    onTapCard: function() {
      const postId = this.properties.post._id;
      this.triggerEvent('tapcard', { postId });
    },
    
    /**
     * 点击点赞按钮
     */
    onTapLike: function(e) {
      // 阻止事件冒泡，避免触发卡片点击事件
      e.stopPropagation();
      
      const postId = this.properties.post._id;
      this.triggerEvent('taplike', { postId });
    },
    
    /**
     * 点击评论按钮
     */
    onTapComment: function(e) {
      // 阻止事件冒泡，避免触发卡片点击事件
      e.stopPropagation();
      
      const postId = this.properties.post._id;
      this.triggerEvent('tapcomment', { postId });
    },
    
    /**
     * 预览图片
     */
    previewImage: function(e) {
      // 阻止事件冒泡，避免触发卡片点击事件
      e.stopPropagation();
      
      const { src, urls } = e.currentTarget.dataset;
      wx.previewImage({
        current: src,
        urls: urls
      });
    }
  }
})
// pages/order-detail/order-detail.js
const db = wx.cloud.database();

Page({
  data: {
    orderId: '',
    orderInfo: null,
    statusHistory: [],
    loading: true,
    openid: ''
  },

  onLoad: function (options) {
    // 获取用户openid
    const openid = wx.getStorageSync('openid');
    this.setData({
      openid
    });
    
    if (options.id) {
      this.setData({
        orderId: options.id
      });
      this.getOrderDetail(options.id);
    } else {
      wx.showToast({
        title: '订单ID不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  getOrderDetail: function(orderId) {
    wx.showLoading({
      title: '加载中',
    });

    // 先直接从数据库获取订单信息
    db.collection('order').doc(orderId).get({
      success: res => {
        const orderInfo = res.data;
        if (orderInfo) {
          orderInfo.info = this.formatInfo(orderInfo);
          orderInfo.stateColor = this.formatState(orderInfo.state);
          
          this.setData({
            orderInfo,
            loading: false
          });
          
          // 然后尝试获取状态历史
          wx.cloud.callFunction({
            name: 'getOrderStatusHistory',
            data: {
              orderId: orderId
            },
            success: res => {
              console.log('获取订单详情成功', res);
              if (res.result && res.result.success) {
                // 格式化时间
                if (res.result.history && res.result.history.length > 0) {
                  const statusHistory = res.result.history.map(item => {
                    return {
                      ...item,
                      createTimeFormat: new Date(item.createTime).toLocaleString()
                    };
                  });
                  
                  this.setData({
                    statusHistory
                  });
                }
              }
              wx.hideLoading();
            },
            fail: err => {
              console.error('获取订单状态历史失败', err);
              // 即使获取历史失败，我们已经有了基本订单信息，所以不显示错误提示
              wx.hideLoading();
            }
          });
        } else {
          wx.showToast({
            title: '订单不存在',
            icon: 'none'
          });
          wx.hideLoading();
          this.setData({
            loading: false
          });
        }
      },
      fail: err => {
        console.error('获取订单详情失败', err);
        wx.showToast({
          title: '获取订单失败',
          icon: 'none'
        });
        wx.hideLoading();
        this.setData({
          loading: false
        });
      }
    });
  },

  formatInfo: function(orderInfo) {
    const { name, info } = orderInfo;
    if (!info) return '';
    
    switch(name) {
      case '快递代取':
        return `快递类型: ${info.size} -- 快递数量: ${info.number}个 -- 快递商家: ${info.business} -- 期望送达: ${info.expectTime} -- 性别限制: ${info.expectGender} -- 备注: ${info.remark}`;
      case '打印服务':
        return `页数: ${info.pageNum} -- 是否彩印: ${info.colorPrint ? '是' : '否'} -- 是否双面: ${info.twoSided ? '是' : '否'} -- 备注: ${info.remark}`;
      case '校园跑腿':
        return `帮助内容: ${info.helpContent} -- 取货地点: ${info.pickUpAddress}`;
      default:
        return JSON.stringify(info);
    }
  },

  formatState: function(state) {
    if (state === '待帮助') return 'top_right';
    else if (state === '已帮助') return 'top_right_help';
    else if (state === '已完成') return 'top_right_finish';
    return '';
  },

  // 确认完成订单
  confirmComplete: function() {
    const { orderInfo } = this.data;
    
    if (!orderInfo || orderInfo.state !== '已帮助' || orderInfo._openid !== wx.getStorageSync('openid')) {
      return;
    }
    
    wx.showModal({
      title: '确认完成',
      content: '确认该订单已完成吗？',
      success: res => {
        if (res.confirm) {
          this.updateOrderStatus(orderInfo._id, '已完成', '用户确认完成');
        }
      }
    });
  },

  // 接单
  takeOrder: function() {
    const { orderInfo } = this.data;
    
    if (!orderInfo || orderInfo.state !== '待帮助') {
      return;
    }
    
    wx.showModal({
      title: '接单确认',
      content: '确认接此订单吗？',
      success: res => {
        if (res.confirm) {
          this.updateOrderStatus(orderInfo._id, '已帮助', '跑腿员接单', true);
        }
      }
    });
  },

  // 更新订单状态
  updateOrderStatus: function(orderId, newStatus, remark, isReceive = false) {
    wx.showLoading({
      title: '处理中',
    });
    
    const updateData = {
      state: newStatus
    };
    
    if (isReceive) {
      updateData.receivePerson = wx.getStorageSync('openid');
    }
    
    if (newStatus === '已完成') {
      updateData.completeTime = db.serverDate();
    }
    
    // 更新订单状态
    db.collection('order').doc(orderId).update({
      data: updateData,
      success: () => {
        // 调用云函数记录状态变更
        wx.cloud.callFunction({
          name: 'updateOrderStatus',
          data: {
            orderId: orderId,
            newStatus: newStatus,
            remark: remark
          },
          success: () => {
            wx.hideLoading();
            wx.showToast({
              title: newStatus === '已帮助' ? '接单成功' : '订单已完成',
              icon: 'success'
            });
            // 重新加载订单详情
            setTimeout(() => {
              this.getOrderDetail(this.data.orderId);
            }, 1500);
          },
          fail: err => {
            console.error('状态更新失败', err);
            wx.hideLoading();
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        });
      },
      fail: err => {
        console.error('更新订单失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    });
  }
});
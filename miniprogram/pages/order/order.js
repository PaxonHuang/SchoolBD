// pages/order/order.js
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabList: ['全部', '我的订单', '我帮助的', '正在悬赏'],
    tabNow: 0,
    orderList: [],
    myOrder: [],
    rewardOrder: [],
    helpOrder: [],
    openid: '',
    helpTotalNum: 0,
    helpTotalMoeny: 0
  },
  
  // 查看订单详情
  viewOrderDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `../order-detail/order-detail?id=${id}`
    });
  },
  selectTab(e) {
    const {
      id
    } = e.currentTarget.dataset;
    this.setData({
      tabNow: id,
    })
    if (id === 0) {
      this.onLoad();
    } else if (id === 1) {
      this.getMyOrder();
    } else if (id === 2) {
      this.getMyHelpOrder();
      this.getHelpTotalNum();
      this.getHelpTotalMoney();  
    } else if (id === 3) {
      this.getRewardOrder();
    }
  },

  // 获取我帮助的订单信息 
  getMyHelpOrder() {
    wx.showLoading({
      title: '加载中',
    })
    db.collection('order').where({
      receivePerson: this.data.openid,
      state: '已完成',
    }).get({
      success: (res) => {
        console.log(res);
        const {
          data
        } = res;
        data.forEach(item => {
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          helpOrder: data,
        })
        wx.hideLoading();
      }
    })
  },

  // 我帮助的订单单数总和
  getHelpTotalNum() {
    db.collection('order').where({
      receivePerson: wx.getStorageSync('openid'),
      state: '已完成'
    }).count({
      success: (res) => {
        console.log(res);
        this.setData({
          helpTotalNum: res.total
        })
      }
    })
  },

  // 我帮助的订单金额总和
  getHelpTotalMoney() {
    const $ = db.command.aggregate;
    db.collection('order').aggregate().match({
      receivePerson: wx.getStorageSync('openid'),
      state: '已完成',
    }).group({
      _id: null,
      totalNum: $.sum('$money'),
    }).end({
      success: (res) => {
        this.setData({
          helpTotalMoeny: res.list[0].totalNum
        })
      }
    })
  },

  // 获取正在悬赏的订单信息
  getRewardOrder() {
    wx.showLoading({
      title: '加载中',
    })
    db.collection('order').where({
      state: '待帮助'
    }).get({
      success: (res) => {
        const {
          data
        } = res;
        data.forEach(item => {
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          rewardOrder: data,
        })
        wx.hideLoading();
      }
    })
  },

  // 获取我的订单信息
  getMyOrder() {
    wx.showLoading({
      title: '加载中',
    })
    db.collection('order').where({
      _openid: this.data.openid
    }).get({
      success: (res) => {
        const {
          data
        } = res;
        data.forEach(item => {
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          myOrder: data,
        })
        wx.hideLoading();
      }
    })
  },

  // 点击接单
  orderReceive(e) {
    wx.showLoading({
      title: '加载中',
    })
    const {
      item
    } = e.currentTarget.dataset;
    const {
      _id
    } = item;
    
    // 获取当前时间作为更新时间
    const updateTime = new Date();
    
    // 先更新本地数据
    db.collection('order').doc(_id).update({
      data: {
        receivePerson: this.data.openid,
        state: '已帮助',
        updateTime: db.serverDate(),
        notifyUser: true,
        hasRead: false
      },
      success: (res) => {
        // 尝试记录状态变更历史
        this.recordStatusChange(_id, '待帮助', '已帮助', '跑腿员接单');
        
        // 无论状态记录是否成功，都刷新订单列表
        if (this.data.tabNow === 0) {
          this.onLoad();
        } else {
          this.getRewardOrder();
        }
        
        wx.hideLoading();
        wx.showToast({
          title: '接单成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('接单失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '接单失败',
          icon: 'error'
        });
      }
    })
  },
  
  // 记录状态变更历史
  recordStatusChange(orderId, oldStatus, newStatus, remark) {
    // 尝试调用云函数
    wx.cloud.callFunction({
      name: 'updateOrderStatus',
      data: {
        orderId,
        newStatus,
        remark
      },
      success: (res) => {
        console.log('状态更新成功', res);
      },
      fail: (err) => {
        console.error('状态更新失败', err);
        
        // 如果云函数调用失败，尝试直接写入状态历史记录
        this.createStatusHistoryRecord(orderId, oldStatus, newStatus, remark);
      }
    });
  },
  
  // 直接创建状态历史记录（云函数调用失败的备用方案）
  createStatusHistoryRecord(orderId, oldStatus, newStatus, remark) {
    // 检查order_status_history集合是否存在
    db.collection('order_status_history').count()
      .then(() => {
        // 集合存在，直接添加记录
        return this.addStatusHistoryRecord(orderId, oldStatus, newStatus, remark);
      })
      .catch(err => {
        if (err.errCode === -1) {
          // 集合不存在，尝试创建集合
          console.log('状态历史集合不存在，将在下次云函数部署后自动创建');
        }
        console.error('检查状态历史集合失败', err);
      });
  },
  
  // 添加状态历史记录
  addStatusHistoryRecord(orderId, oldStatus, newStatus, remark) {
    db.collection('order_status_history').add({
      data: {
        orderId,
        oldStatus,
        newStatus,
        remark: remark || '',
        operatorId: this.data.openid,
        createTime: db.serverDate()
      }
    }).then(res => {
      console.log('状态历史记录添加成功', res);
    }).catch(err => {
      console.error('状态历史记录添加失败', err);
    });
  },

  toFinish(e) {
    wx.showLoading({
      title: '加载中',
    })
    const {
      item
    } = e.currentTarget.dataset;
    const {
      _id
    } = item;
    
    // 先更新本地数据
    db.collection('order').doc(_id).update({
      data: {
        state: '已完成',
        completeTime: db.serverDate(),
        updateTime: db.serverDate(),
        notifyUser: true,
        hasRead: false
      },
      success: (res) => {
        // 尝试记录状态变更历史
        this.recordStatusChange(_id, '已帮助', '已完成', '订单已完成');
        
        // 无论状态记录是否成功，都刷新订单列表
        this.getMyOrder();
        
        wx.hideLoading();
        wx.showToast({
          title: '订单已完成',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('完成订单失败', err);
        wx.hideLoading();
        wx.showToast({
          title: '操作失败',
          icon: 'error'
        });
      }
    })
  },

  formatInfo(orderInfo) {
    const {
      name,
      info,
    } = orderInfo;
    if (name === '快递代取') {
      const {
        business,
        expectGender,
        expectTime,
        number,
        remark,
        size
      } = info;
      return `快递类型: ${size} -- 快递数量: ${number}个 -- 快递商家: ${business} -- 期望送达: ${expectTime} -- 性别限制: ${expectGender} -- 备注: ${remark}`;
    } else if (name === '打印服务') {
      const {
        colorPrint,
        pageNum,
        remark,
        twoSided
      } = info;
      return `页数: ${pageNum} -- 是否彩印: ${colorPrint ? '是' : '否'} -- 是否双面: ${twoSided ? '是' : '否'} -- 备注: ${remark}`;
    } else if (name === '校园跑腿') {
      const {
        helpContent,
        pickUpAddress
      } = info;
      return `帮助内容: ${helpContent} -- 取货地点: ${pickUpAddress}`;
    } else if (name === '快递代寄') {
      const {
        helpContent,
        business,
        remark
      } = info;
      return `帮助内容: ${helpContent} -- 快递商家: ${business} -- 备注: ${remark}`;
    } else if (name === '租借服务') {
      const {
        leaseItem,
        leaseTime,
        deliveryTime
      } = info;
      return `租借物品: ${leaseItem} -- 租借时长: ${leaseTime} -- 预计交货时间: ${deliveryTime}`;
    } else if (name === '游戏陪玩') {
      const {
        gameID,
        gameName,
        gameTime,
        remark
      } = info;
      return `游戏名称: ${gameName} -- 游戏时间or盘数: ${gameTime} -- 游戏ID: ${gameID} -- 备注信息: ${remark}`;
    } else if (name === '帮我送') {
      const {
        deliveryInfo
      } = info;
      return `送达地点: ${deliveryInfo}`;
    } else if (name === '代替服务') {
      const {
        helpContent
      } = info;
      return `帮助内容: ${helpContent}`;
    } else if (name === '其它帮助') {
      const {
        helpContent
      } = info;
      return `帮助内容: ${helpContent}`;
    }
  },

  formatState(state) {
    if (state === '待帮助') {
      return 'top_right';
    } else if (state === '已帮助') {
      return 'top_right_help';
    } else if (state === '已完成') {
      return 'top_right_finish';
    }
  },



  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: '加载中',
    })
    db.collection('order').get({
      success: (res) => {
        const {
          data
        } = res;
        data.forEach(item => {
          item.info = this.formatInfo(item);
          item.stateColor = this.formatState(item.state);
        });
        this.setData({
          orderList: data,
          openid: wx.getStorageSync('openid')
        })
        wx.hideLoading();
      },
      fail: (res) => {
        wx.showToast({
          icon: 'none',
          title: '服务器异常~~~',
        })
        wx.hideLoading();
      }
    })
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
    this.onLoad();
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
    wx.showLoading({
      title: '加载中',
    })
    let {
      orderList,
      myOrder,
      rewardOrder,
      helpOrder,
      tabNow,
      openid
    } = this.data;

    if (tabNow === 0) {
      db.collection('order').skip(orderList.length).get({
        success: (res) => {
          if (res.data.length) {
            res.data.forEach(item => {
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              orderList.push(item);
            })
            this.setData({
              orderList,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
          wx.hideLoading();
        },
        fail: (error) => {
          wx.showToast({
            icon: 'none',
            title: '服务器出错...',
          })
          wx.hideLoading();
        }
      })
    } else if (tabNow === 1) {
      db.collection('order').skip(myOrder.length).where({
        _openid: openid
      }).get({
        success: (res) => {
          if (res.data.length) {
            const {
              data
            } = res;
            data.forEach(item => {
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              myOrder.push(item);
            });
            this.setData({
              myOrder,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
          wx.hideLoading();
        }
      })
    } else if (tabNow === 2) {
      db.collection('order').skip(helpOrder.length).where({
        receivePerson: this.data.openid,
        state: '已完成'
      }).get({
        success: (res) => {
          if (res.data.length) {
            const {
              data
            } = res;
            data.forEach(item => {
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              helpOrder.push(item);
            });
            this.setData({
              helpOrder,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
          wx.hideLoading();
        }
      })
    } else if (tabNow === 3) {
      db.collection('order').skip(rewardOrder.length).where({
        state: '待帮助'
      }).get({
        success: (res) => {
          if (res.data.length) {
            const {
              data
            } = res;
            data.forEach(item => {
              item.info = this.formatInfo(item);
              item.stateColor = this.formatState(item.state);
              rewardOrder.push(item);
            });
            this.setData({
              rewardOrder,
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: '无更多信息',
            })
          }
          wx.hideLoading();
        }
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})
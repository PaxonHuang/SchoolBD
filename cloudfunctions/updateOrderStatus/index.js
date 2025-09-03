// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  
  const { orderId, newStatus, remark } = event
  
  if (!orderId || !newStatus) {
    return {
      success: false,
      message: '订单ID和新状态是必须的'
    }
  }
  
  try {
    // 获取当前订单信息
    const orderRes = await db.collection('order').doc(orderId).get()
    const order = orderRes.data
    
    if (!order) {
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    const oldStatus = order.state
    
    // 更新订单状态
    await db.collection('order').doc(orderId).update({
      data: {
        state: newStatus,
        updateTime: db.serverDate(),
        // 根据状态变更设置通知标志
        notifyUser: newStatus === '已帮助' || newStatus === '已完成',
        notifyRunner: newStatus === '待帮助',
        hasRead: false
      }
    })
    
    // 检查order_status_history集合是否存在，如果不存在则创建
    try {
      await db.createCollection('order_status_history')
      console.log('成功创建 order_status_history 集合')
    } catch (err) {
      if (err.errCode !== -501001) { // 集合已存在的错误码
        console.log('order_status_history 集合已存在或创建失败:', err)
      }
    }
    
    // 记录状态变更历史
    await db.collection('order_status_history').add({
      data: {
        orderId,
        oldStatus,
        newStatus,
        remark: remark || '',
        operatorId: wxContext.OPENID,
        createTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: `订单状态已从 ${oldStatus} 更新为 ${newStatus}`
    }
  } catch (err) {
    console.error('更新订单状态失败:', err)
    return {
      success: false,
      error: err
    }
  }
}
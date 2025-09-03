// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const $ = db.command.aggregate
  
  const { orderId } = event
  
  if (!orderId) {
    return {
      success: false,
      message: '订单ID是必须的'
    }
  }
  
  try {
    // 获取订单详情
    const orderRes = await db.collection('order').doc(orderId).get()
    
    // 检查订单状态历史集合是否存在
    let historyRes = { data: [] }
    try {
      // 获取订单状态历史
      historyRes = await db.collection('order_status_history')
        .where({
          orderId: orderId
        })
        .orderBy('createTime', 'asc')
        .get()
    } catch (historyErr) {
      console.error('获取状态历史失败，可能集合不存在:', historyErr)
      // 如果集合不存在，我们继续处理，只是返回空历史记录
    }
    
    return {
      success: true,
      history: historyRes.data,
      order: orderRes.data
    }
  } catch (err) {
    console.error('获取订单详情失败:', err)
    return {
      success: false,
      error: err,
      message: '订单不存在或已被删除'
    }
  }
}
// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  
  try {
    // 创建订单状态变更历史集合（如果不存在）
    try {
      await db.createCollection('order_status_history')
      console.log('成功创建 order_status_history 集合')
    } catch (err) {
      if (err.errCode !== -501001) { // 集合已存在的错误码
        console.error('创建 order_status_history 集合失败:', err)
      } else {
        console.log('order_status_history 集合已存在')
      }
    }
    
    // 更新订单集合结构，确保所有订单都有正确的状态字段
    try {
      const orderUpdateResult = await db.collection('order').where({
        state: _.exists(true)
      }).update({
        data: {
          updateTime: db.serverDate(),
          // 确保所有订单都有这些字段
          hasRead: false,
          notifyUser: false,
          notifyRunner: false
        }
      })
      console.log('更新订单结构成功:', orderUpdateResult)
    } catch (err) {
      console.error('更新订单结构失败:', err)
    }
    
    return {
      success: true,
      message: '数据库结构初始化完成'
    }
  } catch (err) {
    console.error('初始化数据库结构失败:', err)
    return {
      success: false,
      error: err
    }
  }
}
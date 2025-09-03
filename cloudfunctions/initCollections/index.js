// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 创建集合的辅助函数
async function createCollectionIfNotExists(db, collectionName) {
  try {
    await db.createCollection(collectionName)
    console.log(`成功创建 ${collectionName} 集合`)
    return true
  } catch (err) {
    if (err.errCode !== -501001) { // 集合已存在的错误码
      throw err
    }
    console.log(`${collectionName} 集合已存在`)
    return false
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 创建基础集合
    await createCollectionIfNotExists(db, 'order')
    await createCollectionIfNotExists(db, 'forum_posts')
    await createCollectionIfNotExists(db, 'forum_comments')
    
    // 创建新的集合用于订单状态跟踪
    await createCollectionIfNotExists(db, 'order_status_history')
    
    return {
      success: true,
      message: '集合初始化完成'
    }
  } catch (err) {
    console.error('初始化集合失败:', err)
    return {
      success: false,
      error: err
    }
  }
}
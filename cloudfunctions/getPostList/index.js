// 云函数入口文件 - 极简版本
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

/**
 * 获取帖子列表 - 极简版本，避免超时问题
 */
exports.main = async (event, context) => {
  try {
    console.log('接收到的参数:', event)
    
    // 解构参数
    const { category, pageNum = 0, pageSize = 10 } = event
    
    // 简单查询条件
    const condition = {}
    if (category && category !== 'all') {
      condition.category = category
    }
    
    // 直接查询最新帖子
    const postListResult = await db.collection('forum_posts')
      .where(condition)
      .orderBy('createTime', 'desc')
      .skip(pageNum * pageSize)
      .limit(pageSize)
      .get()
    
    // 返回结果
    return {
      success: true,
      posts: postListResult.data || [],
      total: 100, // 固定值，避免额外查询
      pageNum,
      pageSize
    }
  } catch (err) {
    console.error('获取帖子列表失败:', err)
    return {
      success: false,
      error: '获取帖子列表失败，请重试'
    }
  }
}

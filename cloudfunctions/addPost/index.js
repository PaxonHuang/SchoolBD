// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

/**
 * 发布帖子 - 极简版本，避免超时问题
 */
exports.main = async (event, context) => {
  try {
    console.log('接收到的参数:', event)
    
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    // 解构参数
    const { title, content, images = [], category, categoryName } = event
    
    // 简单参数校验
    if (!title || !content) {
      return { success: false, error: '标题或内容不能为空' }
    }
    
    // 获取当前时间
    const now = new Date()
    
    // 添加帖子 - 只保留最基本字段
    const addResult = await db.collection('forum_posts').add({
      data: {
        title,
        content,
        images,
        category: category || 'other',
        categoryName: categoryName || '其他',
        authorId: openid,
        createTime: now,
        updateTime: now,
        likes: 0,
        comments: 0
      }
    })
    
    return {
      success: true,
      postId: addResult._id
    }
  } catch (err) {
    console.error('发布帖子失败:', err)
    return {
      success: false,
      error: '发布失败，请重试'
    }
  }
}

// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 先确保集合存在
    try {
      await db.createCollection('forum_posts')
      console.log('成功创建 forum_posts 集合')
    } catch (err) {
      if (err.errCode !== -501001) { // 集合已存在的错误码
        throw err
      }
      console.log('forum_posts 集合已存在')
    }
    
    // 检查是否已有测试数据
    const countResult = await db.collection('forum_posts').count()
    if (countResult.total > 0) {
      return {
        success: true,
        message: '测试数据已存在，无需重复添加'
      }
    }
    
    // 添加测试帖子数据
    const testPosts = [
      {
        title: '欢迎使用校园论坛',
        content: '这是一个测试帖子，欢迎大家使用校园论坛功能！',
        category: 'notice',
        categoryName: '通知',
        authorId: openid,
        createTime: new Date(),
        updateTime: new Date(),
        likes: 0,
        comments: 0,
        images: []
      },
      {
        title: '有人知道学校食堂的营业时间吗？',
        content: '最近食堂好像调整了营业时间，有人知道具体是几点到几点吗？',
        category: 'help',
        categoryName: '求助',
        authorId: openid,
        createTime: new Date(),
        updateTime: new Date(),
        likes: 0,
        comments: 0,
        images: []
      },
      {
        title: '出售全新教材',
        content: '有全新的高等数学教材出售，有需要的同学请联系我。',
        category: 'idle',
        categoryName: '闲置',
        authorId: openid,
        createTime: new Date(),
        updateTime: new Date(),
        likes: 0,
        comments: 0,
        images: []
      }
    ]
    
    // 批量添加测试数据
    for (const post of testPosts) {
      await db.collection('forum_posts').add({
        data: post
      })
    }
    
    return {
      success: true,
      message: '测试数据初始化成功'
    }
  } catch (err) {
    console.error('初始化测试数据失败:', err)
    return {
      success: false,
      error: err
    }
  }
}
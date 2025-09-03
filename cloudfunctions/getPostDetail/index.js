// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

/**
 * 获取帖子详情
 * @param {Object} event - 请求参数
 * @param {string} event.postId - 帖子ID
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 解构参数
  const { postId } = event
  
  try {
    // 查询帖子详情
    const postResult = await db.collection('forum_posts')
      .aggregate()
      .match({
        _id: postId
      })
      .lookup({
        from: 'users',
        localField: 'authorId',
        foreignField: '_openid',
        as: 'authorInfo'
      })
      .addFields({
        // 处理作者信息
        author: $.arrayElemAt(['$authorInfo', 0]),
        // 检查当前用户是否点赞
        isLiked: $.in([openid, $.ifNull('$likedBy', [])]),
        // 检查当前用户是否收藏
        isCollected: $.in([openid, $.ifNull('$collectedBy', [])])
      })
      .project({
        _id: 1,
        title: 1,
        content: 1,
        images: 1,
        category: 1,
        categoryName: 1,
        createTime: 1,
        updateTime: 1,
        likes: 1,
        comments: 1,
        isLiked: 1,
        isCollected: 1,
        author: {
          nickName: 1,
          avatarUrl: 1
        }
      })
      .end()
    
    // 如果帖子不存在
    if (postResult.list.length === 0) {
      return {
        success: false,
        error: '帖子不存在或已删除'
      }
    }
    
    // 增加帖子浏览量
    await db.collection('forum_posts').doc(postId).update({
      data: {
        views: _.inc(1)
      }
    })
    
    return {
      success: true,
      post: postResult.list[0]
    }
  } catch (err) {
    console.error('获取帖子详情失败', err)
    return {
      success: false,
      error: err
    }
  }
}
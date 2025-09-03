// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
const $ = db.command.aggregate

/**
 * 获取评论列表
 * @param {Object} event - 请求参数
 * @param {string} event.postId - 帖子ID
 * @param {number} event.pageNum - 页码，从0开始
 * @param {number} event.pageSize - 每页数量
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 解构参数
  const { postId, pageNum = 0, pageSize = 20 } = event
  
  try {
    // 查询评论总数
    const countResult = await db.collection('forum_comments')
      .where({
        postId
      })
      .count()
    
    const total = countResult.total
    
    // 查询评论列表
    const commentListResult = await db.collection('forum_comments')
      .aggregate()
      .match({
        postId
      })
      .sort({
        createTime: 1 // 按时间正序排列，最早的评论在前
      })
      .skip(pageNum * pageSize)
      .limit(pageSize)
      .lookup({
        from: 'users',
        localField: 'authorId',
        foreignField: '_openid',
        as: 'authorInfo'
      })
      .lookup({
        from: 'forum_comments',
        localField: 'replyTo',
        foreignField: '_id',
        as: 'replyInfo'
      })
      .addFields({
        // 处理作者信息
        author: $.arrayElemAt(['$authorInfo', 0]),
        // 处理回复信息
        replyToComment: $.arrayElemAt(['$replyInfo', 0]),
        // 检查当前用户是否点赞
        isLiked: $.in([openid, $.ifNull('$likedBy', [])])
      })
      .lookup({
        from: 'users',
        localField: 'replyToComment.authorId',
        foreignField: '_openid',
        as: 'replyToAuthorInfo'
      })
      .addFields({
        // 处理回复对象的作者信息
        replyTo: $.cond({
          if: $.gt([$.size('$replyToAuthorInfo'), 0]),
          then: {
            commentId: '$replyToComment._id',
            author: $.arrayElemAt(['$replyToAuthorInfo', 0])
          },
          else: null
        })
      })
      .project({
        _id: 1,
        postId: 1,
        content: 1,
        images: 1,
        createTime: 1,
        likes: 1,
        isLiked: 1,
        replyTo: 1,
        author: {
          nickName: 1,
          avatarUrl: 1
        }
      })
      .end()
    
    return {
      success: true,
      comments: commentListResult.list,
      total,
      pageNum,
      pageSize
    }
  } catch (err) {
    console.error('获取评论列表失败', err)
    return {
      success: false,
      error: err
    }
  }
}
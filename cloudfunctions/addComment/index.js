// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

/**
 * 添加评论
 * @param {Object} event - 请求参数
 * @param {string} event.postId - 帖子ID
 * @param {string} event.content - 评论内容
 * @param {Array} event.images - 图片列表（可选）
 * @param {string} event.replyTo - 回复的评论ID（可选）
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 解构参数
  const { postId, content, images = [], replyTo } = event
  
  // 参数校验
  if (!postId) {
    return {
      success: false,
      error: '帖子ID不能为空'
    }
  }
  
  if (!content || content.trim() === '') {
    return {
      success: false,
      error: '评论内容不能为空'
    }
  }
  
  try {
    // 检查内容安全性
    try {
      // 检查文本内容
      const textSecCheckResult = await cloud.callFunction({
        name: 'contentSec',
        data: {
          text: content
        }
      })
      
      if (!textSecCheckResult.result.success) {
        return {
          success: false,
          error: '内容包含敏感信息，请修改后重试'
        }
      }
      
      // 检查图片内容
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imgSecCheckResult = await cloud.callFunction({
            name: 'imagesec',
            data: {
              img: images[i]
            }
          })
          
          if (!imgSecCheckResult.result.success) {
            return {
              success: false,
              error: '图片包含敏感信息，请修改后重试'
            }
          }
        }
      }
    } catch (secErr) {
      console.error('内容安全检查失败', secErr)
      // 内容安全检查失败，继续执行
    }
    
    // 获取当前时间
    const now = new Date()
    const createTime = now.toISOString()
    
    // 添加评论
    const commentData = {
      postId,
      content,
      images,
      authorId: openid,
      createTime,
      likes: 0,
      likedBy: []
    }
    
    // 如果有回复对象，添加回复信息
    if (replyTo) {
      commentData.replyTo = replyTo
    }
    
    const addResult = await db.collection('forum_comments').add({
      data: commentData
    })
    
    // 更新帖子评论数
    await db.collection('forum_posts').doc(postId).update({
      data: {
        comments: _.inc(1)
      }
    })
    
    return {
      success: true,
      commentId: addResult._id
    }
  } catch (err) {
    console.error('添加评论失败', err)
    return {
      success: false,
      error: err
    }
  }
}
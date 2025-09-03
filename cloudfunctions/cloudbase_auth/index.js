'use strict';
const cloud = require('wx-server-sdk')
cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()

    console.log(event)
    console.log(wxContext)
    // 跨账号调用时，由此拿到来源方小程序/公众号 AppID
    console.log(wxContext.FROM_APPID)
    // 跨账号调用时，由此拿到来源方小程序/公众号的用户 OpenID
    console.log(wxContext.FROM_OPENID)
    // 跨账号调用、且满足 unionid 获取条件时，由此拿到同主体下的用户 UnionID
    console.log(wxContext.FROM_UNIONID)

    return {
        errCode: 0,
        errMsg: '',
        auth: JSON.stringify({
            // 允许登录用户创建订单
            canCreateOrder: wxContext.OPENID ? true : false,
            // 用户openid用于验证
            openid: wxContext.OPENID,
            // 用户unionid(如果有)
            unionid: wxContext.UNIONID,
            // 小程序appid
            appid: wxContext.APPID
        }),
    }
}
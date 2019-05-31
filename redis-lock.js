/*
 * @Author: zhangjiangpo 
 * @Date: 2019-05-31 18:09:07 
 */
'use strict'
const UUID = require('uuid');
const REDISLOCK = 'Redis_Lock';

exports.sleep = (time) => {
    return new Promise(resolve => setTimeout(resolve, time))
}
let try_lock = async function (key, expir) {
    let uuid = UUID.v1();
    var result = await config.redis.set(key, uuid, 'EX', expir, 'NX');
    if (result == 'OK') {
        this[REDISLOCK] = uuid;
        return true;
    } else {
        return false;
    }
}
let get_lock = async function (key, expir, wait_time) {
    let locked = false,
        time = Date.now(),
        is_expir = false;
    do {
        locked = await try_lock.call(this, key, expir);
        if (!locked) {
            await exports.sleep(80);
        }
        is_expir = Date.now() - time > wait_time * 1000;
    } while (!locked && wait_time && !is_expir)
    return locked;
}
let get_lock_key = (params = [], key = "") => {
    let rk = "";
    if (Array.isArray(params) && params.length > 0) {
        let param = Object.assign({}, this.query, this.params, this.param);
        rk = "repeat_submit";
        params.map(p => rk += ("_" + (param[p] || "_")));
    } else if (key && key != "") {
        rk = key;
    } else {
        throw new Error("锁的key不能为空");
    }
    return rk;
}
let close_lock = async function (key) {
    let data = await config.redis.get(key);
    //是否本次上下文的锁 是删除 若不是 锁被其他线程获取
    if (data == this[REDISLOCK]) {
        await config.redis.del(key);
    }
}
/**
 * 防止并发锁中间件
 * @param {*} params 请求参数的属性 用来作为防并发唯一key标识
 * @param {*} key 防并发key 与 params参数 不共存 params 优先级高
 * @param {*} expir 锁超时时间 不管请求是否完成 都要释放锁 让其他请求进来 请求完成会释放锁
 * @param {*} wait_time 等待时间 1.undefined 不等待，拿不到锁直接跑错 2.有值 该时间内重复尝试获取锁 超时未获取锁报错
 */
module.exports = function redis_clock(params = [], key = "", expir = 10, wait_time){
    return async (ctx,n) => {
        let rk = get_lock_key.call(ctx, params, key);
        let geted_lock = await get_lock.call(ctx, rk, expir, wait_time);
        //未得到锁
        if (!geted_lock) {
            return ctx.body = {
                code: 121211,
                msg: '正在处理,请稍后重试'
            }
        }
        try {
            await n();
        } catch (e) {
            throw e;
        } finally {
            await close_lock.call(ctx, rk);
        }
    }
}
const koa = require('koa');
var Router = require('koa-router');
var koa_logger = require('koa-logger');
var fs = require('fs');
let redis_clock = require("./redis-lock");
var Redis = require('ioredis');

var app = new koa();
var router = new Router();
var redis = new Redis({
    port: 6379,          // Redis port
    host: '127.0.0.1',   // Redis host
    family: 4,           // 4 (IPv4) or 6 (IPv6)
    //password: 'auth',
    db: 0
  });

let exist = fs.existsSync('./goods_num.json');
if(!exist){
    fs.writeFileSync('./goods_num.json', 2, {flag : 'a'});
}

fs.writeFileSync('./goods_num.json', 2);

global.config = {
    redis
}
//有锁
router.get('/sub/lock',redis_clock([], "goods_num_sub", 3, 3), async (ctx) => {
    let result = await fs.readFileSync('./goods_num.json', {encoding : 'utf-8'});
    console.log(result);
    if(result && Number(result) > 0){
        fs.writeFileSync('./goods_num.json', Number(result) - 1);
        return ctx.body = `sub success ${result} - 1 `;
    }
    ctx.body = "num not enough";
})
//无锁
router.get('/sub', async (ctx) => {
    let result = await fs.readFileSync('./goods_num.json', {encoding : 'utf-8'});
    console.log(result);
    if(result && Number(result) > 0){
        fs.writeFileSync('./goods_num.json', Number(result) - 1);
        return ctx.body = `sub success ${result} - 1 `;
    }
    ctx.body = "num not enough";
})

app.use(koa_logger())
    .use(router.routes())
    .use(router.allowedMethods());
app.listen(3000);
console.log('server on port 3000');
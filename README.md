### quick start
#### install
```node
    npm install
```
#### run by pm2 cluster
```node
    npm install pm2 -g
    pm2 start server.js --name=lock -i 4
```

#### curl
```node
    1.curl -v http://127.0.0.1:3000/sub
    2.curl -v http://127.0.0.1:3000/sub/lock
```

#### result
1.无锁
![](https://wicdn.xiaohongchun.com/goodsmark/1559301711690_5QQMaZWYmf.png)
2.有锁
![](https://wicdn.xiaohongchun.com/goodsmark/1559301711697_Q5xXC3w8dG.png)
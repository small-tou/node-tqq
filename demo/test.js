var QQ = require("../lib/index.js");
var underscore=require("underscore");
var path=require("path")
var config = {
    app_key:"801287005",
    app_secret:"4f84e329fb8a7638ee8c0bc0881a24b7",
    redirect_uri:"http://localhost:8080/sina_auth_cb",
}

var app_auth = {
    auth:function (req, res) {
        var api = new QQ(config);
        var auth_url = api.oauth.authorize();
        res.redirect(auth_url);
        res.end();
    },
    sina_auth_cb:function (req, res) {
        var code = req.query.code;
        var api = new QQ(config);
        api.oauth.accesstoken(code, function (error,data) {
            res.cookie("token", data.access_token);
            res.cookie("openid",data.openid)
            res.redirect('oauth');
            res.end();
        })

    }
}
//import some libs 
var express = require('express');
var cons = require('consolidate');
//init express app
var app = express();
app.use(express.logger({
    format:':method :url :status'
}));
//设置文件上传临时文件夹
app.use(express.bodyParser({
    uploadDir:'./uploads'
}));
app.use(express.cookieParser());
app.use(express.session({
    secret:'yutou'
}));
app.use(app.router);
app.use(express.errorHandler({
    dumpExceptions:true,
    showStack:true
}));
app.error = function (err, req, res) {
    console.log("500:" + err + " file:" + req.url)
    res.render('500');
}
//设置模板引擎为mustache，这里使用了consolidate库
app.engine("html", cons.mustache);
//设置模板路径
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.set('view options', {
    layout:false
})
app.listen("8080")
//获取authorize url
app.get("/auth", app_auth.auth)
//获取accesstoken ,存储，并设置userid到cookie
app.get("/sina_auth_cb", app_auth.sina_auth_cb)
//中间页面，提醒用户认证成功
app.get('/oauth', function (req, res) {
    var config = {
        app_key:"801287005",
        app_secret:"4f84e329fb8a7638ee8c0bc0881a24b7",
        scope:"all",
        redirect_uri:"http://localhost:8080/sina_auth_cb",
    }
    var api = new QQ(config);
    api.t.add_pic({
        content:"hello nodejs with pic",
        clientip:"115.193.182.232",
        pic:path.join(__dirname, "/test.jpg"),
        openid:req.cookies.openid,
        access_token:req.cookies.token
    },function(error,data){
        console.log(data)
    })
    res.end("dd")
//    api.blog.addBlog({
//        title:("hello nodejs !"),
//        content:"this blog is create by nodejs :https://github.com/xinyu198736/node-renren",
//        access_token:(req.cookies.token)
//    }, function (error,data) {
//        console.log(data);
//    });
//判断共同好友的例子
//    /**
// api.friends.getSameFriends({
//        uid1:83838506,
//        uid2:230901848,
//        fields:"uid,name",
//        access_token:(req.cookies.token)
//    }, function (error,data) {
//        console.log(data);
//        var data = JSON.parse(data);
//        var text="系统判断，我和@孙歌(230901848) 的共同好友有："
//        data.friends.forEach(function(person){
//            text+="@"+person.name+"("+person.uid+")"+" ";
//        })
//        api.status.set({
//            status:text,
//            access_token:(req.cookies.token)
//        })
//        res.render('oauth.html');
//    }); 
//    **/
//    api.photos.upload({
//        upload:path.join(__dirname, "/test.jpg"),
//        caption:"upload by nodejs"
//    },function(error,data){
//        console.log(data)
//    })
    
});





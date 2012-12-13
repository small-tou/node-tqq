var querystring = require('querystring');
var https = require('https');
var path = require("path");
var fs = require('fs');
var underscore = require("underscore");
var md5 = require("MD5");
var request = require('request');
var FormData = require('form-data');
var apiGroup={
    t:{
        scope: [],
        methods: ["add","add_pic","reply","re_add","del","show","re_count","re_list","comment","list","sub_re_count","add_emotion","add_pic_url",""]
    },
}
var QQ=function(options){
    this.options = { 
    app_key:null,
    app_secret:null,
    access_token:null,
    user_id:0,
    refresh_token:null,
    format:"JSON",
    redirect_uri:"",
    api_group:[],
    scope:""
  };
  underscore.extend(this.options, options);
  //根据api_group自动生成scope
  var scopes=[]
  this.options.api_group.forEach( function (v) {
    if(apiGroup[v]){
      scopes=scopes.concat(apiGroup[v].scope);
    };
  });
  underscore.uniq(scopes);
  this.options.scope=scopes.join(",");
  this.base=this._base();
  this.oauth=this._oauth();
  this.t=this._t();
}
QQ.prototype = {
    API_BASE_URL: 'https://open.t.qq.com',
    API_HOST: 'open.t.qq.com',
    API_URI_PREFIX: '/api'
};
QQ.prototype._base = function () {
    var self = this;
    return {
        _post:function (options, callback,isMulti) {
            if (self.options.access_token) {
                options['access_token'] = self.options.access_token;
            }
            options['oauth_version']="2.a"
            options['format'] = "json";
            options['oauth_consumer_key']=self.options.app_key
            options['scope']=options['scope']||"all"
            if(isMulti){
                var form = new FormData();
                for (var i in options) {
                    if (i=="pic") {
                        form.append('pic', fs.createReadStream(options[i]));
                    } else {
                        form.append(i, options[i].replace(/__multi__/g, ""));
                    }
                };
                form.submit(self.API_BASE_URL+options.path, function(err, res) {
                    var chunks=[];
                    var size=0;
                    res.on("data",function (chunk) {
                        chunks.push(chunk);
                        size += chunk.length;
                    })
                    res.on("end",function () {
                        switch (chunks.length) {
                            case 0:
                                data = new Buffer(0);
                                break;
                            case 1:
                                data = chunks[0];
                                break;
                            default:
                                data = new Buffer(size);
                                for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                                    chunks[i].copy(data, pos);
                                    pos += chunks[i].length;
                                }
                                break;
                        }
                        callback({}, data.toString())
                    })
                    res.on("close", function(data) {
                        callback({error:data}, data.toString())
                    })
                });
            } else {
                var post_body = querystring.stringify(options);
                //用此方法可以传入多个相同名字的参数数组。
                post_body = post_body.replace(/__multi__/g, "");
                console.log(self.API_BASE_URL+options.path)
                request.post({
                    headers:{
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    url: self.API_BASE_URL+options.path,
                    body: post_body
                }, function (e, r, body) {
                    callback && callback({}, body);
                });
            }
        }
    }
};
QQ.prototype._oauth = function () {
    var self = this;
    return {
        //生成authorize url
        authorize:function () {
            var options = {
                client_id:self.options.app_key,
                response_type:"code",
                redirect_uri:self.options.redirect_uri,
                scope:self.options.scope
            };
            return  'https://open.t.qq.com/cgi-bin/oauth2/authorize?' + querystring.stringify(options);
        },
        //用code换取accesstoken
        accesstoken:function (code, callback) {
            var options = {
                grant_type:"authorization_code",
                code:code,
                client_id:self.options.app_key,
                client_secret:self.options.app_secret,
                redirect_uri:self.options.redirect_uri
            };
            /**
             * {
    "access_token": "10000|5.a6b7dbd428f731035f771b8d15063f61.86400.1292922000-222209506",
    "expires_in": 87063,
    "refresh_token": "10000|0.385d55f8615fdfd9edb7c4b5ebdc3e39-222209506",
    "scope": "read_user_album read_user_feed"
}
             */
            var post_body = querystring.stringify(options);
            var headers = {};
        //    headers ["Content-length"] = post_body ? post_body.length : 0;
            headers ["Content-Type"] = 'application/x-www-form-urlencoded';
            var opts = {
                host:"https://open.t.qq.com",
                path:'/cgi-bin/oauth2/access_token',
                method:'POST',
                headers:headers
            };
            request({
                url:opts.host+opts.path,
                method:'POST',
                headers:headers,
                body:post_body
            },function(e,r,body){
                body=querystring.parse(body)
                callback&&callback({},body)
            })
         //   self.base._request(opts, post_body, callback);
        }
    }
};
QQ.prototype._t = function () {
    var t = {};
    var self = this;
    apiGroup.t.methods.forEach(function (m) {
        t[m] = function (options, callback) {
            options.path =self.API_URI_PREFIX+ "/t/" + m;
            self.base._post(options, callback,(m=="add_pic"?true:false));
        }
    });
    return t;
};
exports = module.exports = QQ;



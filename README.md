# eweixin.js

本JS工具是对 [微信官方 JS-SDK jweixin-1.0.0.js](https://res.wx.qq.com/open/js/jweixin-1.0.0.js) 做了一层简单的封装包裹处理,让微信的接口调用更便捷和随意，至少你可以忽略它的一些**步骤顺序**要求。[官方文档](http://mp.weixin.qq.com/wiki/7/aaa137b55fb2e0456bf8dd9148dd613f.html)里面说明了 `jWeixin` 或者叫 `wx` 的使用规范,你需要按照它的步骤一步接一步的去验证配置、捕获 `ready`最后开始去调用它的接口。(当然在 `eweixin` 中使用大部分接口你还是需要 `config` )

## 依赖

由于 `eweixin` 只是对 `jweixin` 做了简单封装处理，并不是完全替换它。

所以需要强制依赖[jweixin-1.0.0.js](https://github.com/EthanZhong/jweixin.git#1.0.0)

## 相关

* 可能你的电脑已经安装了 `Apache` 或者 `APMServ` 更或者其实你一直都是用 `node` 的一些工具包来启动一个你本地的服务器环境

* 想做一些本地测试最好给你的 `HOST` 文件加点东西 `eg: 127.0.0.1  ethan.qq.com`  (`wx` 的分享功能在 **qq domain** 下可以直接使用不需要签名验证)

* [微信web开发者工具](http://mp.weixin.qq.com/wiki/10/e5f772f4521da17fa0d7304f68b97d7e.html) 一款官方调试工具，并且它还集成了 `weinre` 可以做手机联调
 
* `wx` 的接口调用分两个条件(支付、卡券 类的额外签名另算)

	1. `window.WeixinJSBridge` 链接成功 （所有接口调用的基本条件）(`eweixin.isBridge`)

	2. `wx.confing` 签名验证成功（大部分接口调用的附加条件）(`eweixin.isConfig`)

## 两者

又是因为只是简单封装所以 `wx`的绝大部分接口怎么用 `eweixin` 就**可以**怎么用 ，只有如下一些区别:

1. `eweixin` 中没有类似 `wx.ready` `wx.error` 的处理 

2. `eweixin.config` 增加可选 `success` and `fail` 回调函数
	
	```js
	eweixin.config({
		appId:'',
		timestamp:'',
		signature:'',
		....
	},function(res){
		alert('config success');
	},function(res){
		alert('config error');
	});
	```
3. `eweixin` 中增加了一些属性和方法 `eweixin.isWechat` `eweixin.isQQdomain` `eweixin.isBridge` `eweixin.isConfig`  `eweixin.setShare`  `eweixin.changeContent`  `eweixin.changeCallback`



## 安装

你可以通过 `bower` 来安装

```shell
bower install eweixin --save
```

## 引用

这里有一个抱歉的说明，如果你用 `AMD` 引入，需要在 `require.config` 中做下路径配置

因为`define(['jweixin'],function(wx){...});` 居然被写死在 `eweixin.js` 中

```js
require.config({
	paths:{
		jweixin:'../bower_components/jweixin/jweixin-1.0.0'
	}
});
```
 
## 使用

几个简单使用对比

假设你的合法签名信息

```js
var cgInfo={
	debug:true,
	appId:'xxx',
	timestamp:11111,
	...
};
```

#### 普通接口对比(无需签名验证条件)

下面拿`getNetworkType`做对比，其它普通接口一样 例如： `previewImage` `showOptionMenu` `openProductSpecificView` 等

```html
<head>
<script type="text/javascript" src="../bower_components/jweixin/jweixin-1.0.0.js"></script>
<script type="text/javascript">
	/*wx not work*/
	wx.getNetworkType({
		success:function(res){
			alert(res.networkType);
		}
	});
</script>
</head>
```

```html
<head>
<script type="text/javascript" src="../bower_components/jweixin/jweixin-1.0.0.js"></script>
<script type="text/javascript">
	/*wx work*/
	var delay=window.setInterval(function(){
		if(window.WeixinJSBridge){
			window.clearInterval(delay);
			wx.getNetworkType({
				success:function(res){
					alert(res.networkType);
				}
			});
		}
	},50);
</script>
</head>
```

```html
<head>
<script type="text/javascript" src="../bower_components/jweixin/jweixin-1.0.0.js"></script>
<script type="text/javascript">
	/*wx work*/
	wx.ready(function(){
		wx.getNetworkType({
			success:function(res){
				alert(res.networkType);
			}
		});
	});
	wx.config(cgInfo);
</script>
</head>
```

```html
<head>
<script type="text/javascript" src="../bower_components/jweixin/jweixin-1.0.0.js"></script>
<script type="text/javascript" src="../bower_components/eweixin/eweixin.js"></script>
<script type="text/javascript">
	/*eweixin work*/
	eweixin.getNetworkType({
		success:function(res){
			alert(res.networkType);
		}
	});
</script>
</head>
```

其实就是`eweixin`做了`WeixinJSBridgeReady`处理，当我们调用`eweixin.getNetworkType`时先判断是否已经链接成功，如果没有则储存在等待队列，一旦链接成功后马上再执行。

#### 需要验证接口对比

```js
//需要按照这个逻辑和顺序
wx.ready(function(){
	wx.onMenuShareTimeline({
		...
	});
	wx.onMenuShareAppMessage({
		...
	});
	wx.onMenuShareQQ({
		...
	});
	...
});
wx.config(cgInfo);

```

```js
//常规这么配置并设置全平台分享
eweixin.config(cgInfo).setShare({
	...
});
```

```js
//或者 在任意时间、任意地方
eweixin.setShare({
	...
});
```

```js
//或者 在任意时间、任意地方
eweixin.config(cgInfo);
```

```js
/**
 * 如果你的项目就是部署在腾讯域名下
 * 就这样就OK你们的分享配置已经完成了 不再需要 config 
 */
eweixin.setShare({
	...
});
```

		example/index.html 中有一些接口使用范例(由于是本地环境并没有签名信息可用，所以请模拟 qq 域名测试)


## 写在最后

这个工具可能没有你想象的那么有用，甚至怀疑它存在的理由。经常一个项目在不同的步骤需要修改不同的分享内容，不同的分享链接，在某些动作后还要捕获用户分享成功然后做点什么，再然后去掉分享回调。。。(是的 `wx` 其实都能干)
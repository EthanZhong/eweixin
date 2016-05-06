;(function(global,factory){
	if(global.document&&global.self&&global.self==global.top){
		if(typeof define==='function'&&define.amd){
			define(['jweixin'],function(wx){
				return factory(global,wx);
			});
		}else if(typeof module !== 'undefined' && module.exports){
			module.exports = factory(global,require('jweixin'));
		}else{
			global.eweixin=factory(global,global.wx);
		}
	}else{
		throw new Error( 'eweixin requires a window with a document and window.self must be equal to window.top' );
	}
})(typeof window!=='undefined'?window:this,function(global,wx){
  	/*判断是否是数组*/
  	var isArray=function(value){
		if(Array.isArray){
			return Array.isArray(value);
		}else{
			return Object.prototype.toString.call(value)==='[object Array]';
		}
	}
  	/*判断是否是空数组*/
  	var isEmptyArray=function(value){
  		return isArray(value)&&(value.length===0);
  	}
	/*判断是否是 Object*/
	var isObject=function(value){
		return value !== null&&!isArray(value) && typeof value === 'object';
	}
  	/*判断是否是 String*/
  	var isString=function(value){
  		return typeof value === 'string';
  	}
  	/*判断是否是 Function*/
  	var isFunction=function(value){
  		return typeof value==='function';
  	}
  	/*判断是否是 Boolean*/
  	var isBoolean=function(value){
  		return typeof value==='boolean';
  	}
  	/*判断是否是 undefined*/
  	var isUndefined=function(value){
  		return typeof value==='undefined';
  	}
  	/*判断是否是微信内置浏览器*/
  	var isWechat=(global.navigator.userAgent.toLowerCase().match(/microMessenger/i)=='micromessenger');
  	/*判断是否是腾讯域名*/
  	var isQQdomain=/\.qq\.com/g.test(global.location.host);
  	/*是否已经 config*/
  	var hasConfig=false;
  	/**
  	 * 所有的分享参数名称
  	 * title     分享标题
  	 * desc      分享描述
  	 * link      分享链接
  	 * imgUrl    分享图片
  	 * type      分享类型  music video或link 不填默认为link
  	 * dataUrl   如果 type 是 music 或 video 则要提供数据链接 默认为空
  	 */
	var shareKeyNames=['title','desc','link','imgUrl','type','dataUrl'];
	/**
  	 * 所有的回调函数名称 
  	 * jwexin 官方说明(所有接口除自身所需参数外都可以接受回调参数)
  	 * ewexin 绝大部分接口都是对 jweixin 接口的包裹 所以参数 args 也都接受回调参数
  	 */
	var callBackNames=['success','fail','complete','cancel','trigger'];
  	/*所有菜单项列表*/
	var menuList=[
		/*基本类*/
		'menuItem:exposeArticle',			//举报 
		'menuItem:setFont',					//调整字体
		'menuItem:dayMode',					//日间模式
		'menuItem:nightMode',				//夜间模式
		'menuItem:refresh',					//刷新
		'menuItem:profile',					//查看公众号（已添加）
		'menuItem:addContact',				//查看公众号（未添加）
		/*传播类*/
		'menuItem:share:appMessage',		//发送给朋友
		'menuItem:share:timeline',			//分享到朋友圈
		'menuItem:share:qq',				//分享到QQ
		'menuItem:share:weiboApp',			//分享到Weibo
		'menuItem:favorite',				//收藏
		'menuItem:share:facebook',			//分享到FB
		'menuItem:share:QZone',				//分享到 QQ 空间
		/*保护类*/
		'menuItem:editTag',					//编辑标签
		'menuItem:delete',					//删除
		'menuItem:copyUrl',					//复制链接
		'menuItem:originPage',				//原网页
		'menuItem:readMode',				//阅读模式
		'menuItem:openWithQQBrowser',		//在QQ浏览器中打开
		'menuItem:openWithSafari',			//在Safari中打开
		'menuItem:share:email',				//邮件
		'menuItem:share:brand'				//一些特殊公众号
	];
  	/*所有接口以及调用需求*/
  	var apiList={
		onMenuShareAppMessage:	(isQQdomain)?'bridge':'config',
      	onMenuShareTimeline:	(isQQdomain)?'bridge':'config',
		onMenuShareQQ:			(isQQdomain)?'bridge':'config',
		onMenuShareWeibo:		(isQQdomain)?'bridge':'config',
		onMenuShareQZone:		(isQQdomain)?'bridge':'config',
  		checkJsApi:				'bridge',
		previewImage:			'bridge',
		getNetworkType:			'bridge',
		showOptionMenu:			'bridge',
		hideOptionMenu:			'bridge',
		closeWindow:			'bridge',
		openProductSpecificView:'bridge',
		addCard:				'bridge',
		startRecord:			'config',
		stopRecord:				'config',
		onVoiceRecordEnd:		'config',
		playVoice:				'config',
		pauseVoice:				'config',
		stopVoice:				'config',
		onVoicePlayEnd:			'config',
		uploadVoice:			'config',
		downloadVoice:			'config',
		chooseImage:			'config',
		uploadImage:			'config',
		downloadImage:			'config',
		translateVoice:			'config',
		openLocation:			'config',
		getLocation:			'config',
		hideMenuItems:			'config',
		showMenuItems:			'config',
		hideAllNonBaseMenuItem:	'config',
		showAllNonBaseMenuItem:	'config',
		scanQRCode:				'config',
		chooseWXPay:			'config',
		chooseCard:				'config',
		openCard:				'config'
  	};
  	/*所有接口列表数组 将会从 apiList 中历遍提取*/
  	var apiNams=[];
  	/*WeixinJSBridge 连接后需要执行的等待方法队列*/
	var waitBridgeGroup=[];
	/*config 签名验证成功后需要执行的等待方法队列*/
	var waitConfigGroup=[];
	/*微信朋友分享信息*/
	var AMinfo={};
	/*微信朋友圈分享信息*/
	var TLinfo={};
	/*腾讯好友分享信息*/
	var QQinfo={};
	/*腾讯微博分享信息*/
	var WBinfo={};
	/*腾讯空间分享信息*/
	var QZinfo={};
  	/*eweixin 对象*/
	var eweixin={
		/*分享平台*/
		platforms:{
	  		AM:'appmessage',
			TL:'timeline',
	  		QQ:'qq',
	  		WB:'weibo',
	  		QZ:'qzone'
		}
	};
	/*是否为微信浏览器*/
	Object.defineProperty(eweixin,'isWechat',{
		get:function(){
			return isWechat;
		}
	});
	/*是否是腾讯域名*/
	Object.defineProperty(eweixin,'isQQdomain',{
		get:function(){
			return isQQdomain;
		}
	});
	/*WeixinJSBridge 是否链接*/
	Object.defineProperty(eweixin,'isBridge',{
		get:function(){
			return !isUndefined(global.WeixinJSBridge);
		}
	});
	/*是否完成配置验证*/
	Object.defineProperty(eweixin,'isConfig',{
		get:function(){
			return hasConfig;
		}
	});
	/*对 `wx` 的所有接口进行包裹处理*/
	for(var i in apiList){
		apiNams.push(i);
		/**
		 * `wx` 接口包裹处理
		 * @params args            		object    参数对象
		 * @return eweixin         
		 */
		eweixin[i]=wrapperMethod(i);
	}
    /**
	 *config 提交签名信息验证,并执行成功或失败回调
	 *@params configs           	Object   签名信息
	 *		      configs.debug     boolean  (默认false)是否开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。             
     *		   	  configs.appId     string   (必填)公众号的唯一标识
     *		      configs.timestamp string   (必填)生成签名的时间戳(后端参与签名的时间戳)
     *		      configs.nonceStr  string   (必填)生成签名的随机串(后端参与签名的随机串)
     *		      configs.signature string   (必填)签名(后端计算出的签名信息)
     *		      configs.jsApiList array    (默认全部JS接口)需要使用的JS接口列表
     *@params success           	function 验证成功后回调 
     *@params fail              	function 验证失败后回调 
     *@return eweixin
     */
	eweixin.config=function(configs,success,fail){
		if(hasConfig){
			isFunction(success)&&success({'errMsg':'config:ok has already config'});
		}else if(!isObject(configs)){
			isFunction(fail)&&fail({'errMsg':'config:invalid configs args'});
		}else{
			/*经过测试发现 config 验证发出后 会按照 `wx.error`  `wx.ready` 添加的顺序执行 所以把 wx.error 放第一位 如果验证成功不会执行 wx.error */
			var isError=false;
			wx.error(function(msg){
				isError=true;
				isFunction(fail)&&fail(msg);
			});
			wx.ready(function(msg){
				/*if(msg.errMsg==='config:ok')*/
				if(!isError){
					hasConfig=true;
					executeGroup('confing');
					isFunction(success)&&success(msg);
				}
			});
			/*填充默认属性 调用 wx.config 进行验证*/
			var cfApiList=configs.jsApiList;
			configs.jsApiList=(isArray(cfApiList)&&!isEmptyArray(cfApiList))?cfApiList:apiNams;
			configs.debug=(isUndefined(configs.debug))?false:configs.debug;
			wx.config(configs);
		}
		return this;
	}
	/**
	 *判断当前客户端版本是否支持指定JS接口(checkJsApi接口是客户端6.0.2新引入的一个预留接口，第一期开放的接口均可不使用checkJsApi来检测)(覆盖默认)
	 *@params args            		object    参数对象
	 *		      args.jsApiList  	array     需要检测的JS接口列表 (默认所有接口列表)
	 *@return eweixin
	 *
	 *	```js
	 * 	eweixin.checkJsApi({
	 * 		jsApiList:[
	 * 			'chooseImage',
	 * 			'openLocation'
	 * 		],
	 * 		success:function(res){
	 * 			console.log(JSON.stringify(res));//{"errMsg":"checkJsApi:ok","checkResult":{"chooseImage":true,"openLocation":false}}
	 * 		}
	 * 	});
	 * 	```
	 */
	eweixin.checkJsApi=wrapperMethod('checkJsApi',{
		jsApiList:apiNams,
		success:function(res){}
	});
	/**
	 *批量隐藏功能按钮(覆盖默认)
	 *@params args            	object 		参数对象
	 *        	args.menuList   array  		需要隐藏的功能按钮数组 (默认隐藏所有功能按钮)
	 *@retrun eweixin
	 */
	eweixin.hideMenuItems=wrapperMethod('hideMenuItems',{
		menuList:menuList,
		success:function(res){}
	});
	/**
	 *批量显示功能按钮(覆盖默认)
	 *@params args           	object 		参数对象
	 *        	args.menuList   array  		需要显示的功能按钮数组 (默认显示所有功能按钮)
	 *@retrun eweixin
	 */
	eweixin.showMenuItems=wrapperMethod('showMenuItems',{
		menuList:menuList,
		success:function(res){}
	});
	/**
	 * 微信好友分享(覆盖默认)
	 * @params args 		object 			参数对象 (参考 shareKeyNames 和 callBackNames)
	 * @return eweixin
	 */
	eweixin.onMenuShareAppMessage=function(args){
		copy.apply(null,[AMinfo].concat(Array.prototype.slice.call(arguments)));
		return waitExecuteMethod('onMenuShareAppMessage',AMinfo);
	}
	/**
	 *微信好友分享修改
	 *@params key   	string 				需要改变的参数名  如果传入 'clear' 则清空所有参数
	 *@params value 	string|function 	对应 key 的值     如果传入空值则清空对应的参数
	 *@return eweixin
	 */
	eweixin.appmessageChangeContent=function(key,value){
		return this.onMenuShareAppMessage(changeInfo(AMinfo,shareKeyNames,key,value));
	}
	eweixin.appmessageChangeCallback=function(key,value){
		return this.onMenuShareAppMessage(changeInfo(AMinfo,callBackNames,key,value));
	}
	/**
	 * 微信朋友圈分享(覆盖默认)
	 * @params args 		object 			参数对象 (参考 shareKeyNames 和 callBackNames)
	 * @return eweixin
	 */
	eweixin.onMenuShareTimeline=function(args){
		copy.apply(null,[TLinfo].concat(Array.prototype.slice.call(arguments)));
		if(TLinfo.desc){
			TLinfo.title=TLinfo.desc;
		}
		return waitExecuteMethod('onMenuShareTimeline',TLinfo);
	}
	/**
	 *微信朋友圈分享修改
	 *@params key   	string 				需要改变的参数名  	如果传入 'clear' 则清空所有参数
	 *@params value 	string|function 	对应 key 的值		如果传入空值则清空对应的参数
	 *@retrun eweixin
	 */
	eweixin.timelineChangeContent=function(key,value){
		return this.onMenuShareTimeline(changeInfo(TLinfo,shareKeyNames,key,value));
	}
	eweixin.timelineChangeCallback=function(key,value){
		return this.onMenuShareTimeline(changeInfo(TLinfo,callBackNames,key,value));
	}
	/**
	 * 腾讯好友分享(覆盖默认)
	 * @params args 		object 			参数对象 (参考 shareKeyNames 和 callBackNames)
	 * @return eweixin
	 */
	eweixin.onMenuShareQQ=function(args){
		copy.apply(null,[QQinfo].concat(Array.prototype.slice.call(arguments)));
		return waitExecuteMethod('onMenuShareQQ',QQinfo);
	}
	/**
	 *腾讯好友分享修改
	 *@params key   	string 				需要改变的参数名  	如果传入 'clear' 则清空所有参数
	 *@params value 	string|function 	对应 key 的值		如果传入空值则清空对应的参数
	 *@return eweixin
	 */
	eweixin.qqChangeContent=function(key,value){
		return this.onMenuShareQQ(changeInfo(QQinfo,shareKeyNames,key,value));
	}
	eweixin.qqChangeCallback=function(key,value){
		return this.onMenuShareQQ(changeInfo(QQinfo,callBackNames,key,value));
	}
	/**
	 * 腾讯微博分享(覆盖默认)
	 * @params args 		object 			参数对象 (参考 shareKeyNames 和 callBackNames)
	 * @return eweixin
	 */
	eweixin.onMenuShareWeibo=function(args){
		copy.apply(null,[WBinfo].concat(Array.prototype.slice.call(arguments)));
		return waitExecuteMethod('onMenuShareWeibo',WBinfo);
	}
	/**
	 *腾讯微博分享修改
	 *@params key   	string 				需要改变的参数名  	如果传入 'clear' 则清空所有参数
	 *@params value 	string|function 	对应 key 的值		如果传入空值则清空对应的参数
	 *@return eweixin
	 */
	eweixin.weiboChangeContent=function(key,value){
		return this.onMenuShareWeibo(changeInfo(WBinfo,shareKeyNames,key,value));
	}
	eweixin.weiboChangeCallback=function(key,value){
		return this.onMenuShareWeibo(changeInfo(WBinfo,callBackNames,key,value));
	}
	/**
	 * 腾讯空间分享(覆盖默认)
	 * @params args 		object 			参数对象 (参考 shareKeyNames 和 callBackNames)
	 * @return eweixin
	 */
	eweixin.onMenuShareQZone=function(args){
		copy.apply(null,[QZinfo].concat(Array.prototype.slice.call(arguments)));
		return waitExecuteMethod('onMenuShareQZone',QZinfo);
	}
	/**
	 *腾讯空间分享修改
	 *@params key   	string 				需要改变的参数名  	如果传入 'clear' 则清空所有参数
	 *@params value 	string|function 	对应 key 的值		如果传入空值则清空对应的参数
	 *@return eweixin
	 */
	eweixin.qzoneChangeContent=function(key,value){
		return this.onMenuShareQZone(changeInfo(QZinfo,shareKeyNames,key,value));
	}
	eweixin.qzoneChangeCallback=function(key,value){
		return this.onMenuShareQZone(changeInfo(QZinfo,callBackNames,key,value));
	}
	/**
	 *统一设置自定义分享
	 *@params platform      string  	分享平台 (参照 eweinxin.platforms) (该参数可以忽略不传递 则设置所有平台)
	 *@params args  		object  	分享内容和回调参数
	 *@return eweixin
	 */
	eweixin.setShare=function(platform,args){
		var _args=copy.apply(null,[null].concat(Array.prototype.slice.call(arguments)));
		switch(platform){
			case this.platforms.AM:
				this.onMenuShareAppMessage(_args);
				break;
			case this.platforms.TL:
				this.onMenuShareTimeline(_args);
				break;
			case this.platforms.QQ:
				this.onMenuShareQQ(_args);
				break;
			case this.platforms.WB:
				this.onMenuShareWeibo(_args);
				break;
			case this.platforms.QZ:
				this.onMenuShareQZone(_args);
				break;
			default:
				this.onMenuShareAppMessage(_args);
				this.onMenuShareTimeline(_args);
				this.onMenuShareQQ(_args);
				this.onMenuShareWeibo(_args);
				this.onMenuShareQZone(_args);
				break;
		}
		return this;
	}
	/**
	 *统一修改自定义分享
	 *@params platform   	string  				分享平台 (参照 eweinxin.platforms) (该参数可以忽略不传递 则设置所有平台)
	 *@params key   		string 					需要改变的参数名 (如果传入 'clear' 则清空对应类型的所有参数)
	 *@params value 		string|function 		对应 key 的值	如果传入空值则清空对应的参数
	 *@return eweixin
	 */
	eweixin.changeContent=function(platform,key,value){
		var _args=Array.prototype.slice.call(arguments,-2);
		switch(platform){
			case this.platforms.AM:
				this.appmessageChangeContent(key,value);
				break;
			case this.platforms.TL:
				this.timelineChangeContent(key,value);
				break;
			case this.platforms.QQ:
				this.qqChangeContent(key,value);
				break;
			case this.platforms.WB:
				this.weiboChangeContent(key,value);
				break;
			case this.platforms.QZ:
				this.qzoneChangeContent(key,value);
				break;
			default:
				this.appmessageChangeContent(_args[0],_args[1]);
				this.timelineChangeContent(_args[0],_args[1]);
				this.qqChangeContent(_args[0],_args[1]);
				this.weiboChangeContent(_args[0],_args[1]);
				this.qzoneChangeContent(_args[0],_args[1]);
				break;
		}
		return this;
	}
	eweixin.changeCallback=function(platform,key,value){
		var _args=Array.prototype.slice.call(arguments,-2);
		switch(platform){
			case this.platforms.AM:
				this.appmessageChangeCallback(key,value);
				break;
			case this.platforms.TL:
				this.timelineChangeCallback(key,value);
				break;
			case this.platforms.QQ:
				this.qqChangeCallback(key,value);
				break;
			case this.platforms.WB:
				this.weiboChangeCallback(key,value);
				break;
			case this.platforms.QZ:
				this.qzoneChangeCallback(key,value);
				break;
			default:
				this.appmessageChangeCallback(_args[0],_args[1]);
				this.timelineChangeCallback(_args[0],_args[1]);
				this.qqChangeCallback(_args[0],_args[1]);
				this.weiboChangeCallback(_args[0],_args[1]);
				this.qzoneChangeCallback(_args[0],_args[1]);
				break;
		}
		return this;
	}
	/**
	 * 包装 `wx` 的接口方法 
	 * @param  {string} 	method  	`wx`的接口名称
	 * @return {function}        		`eweixin`的对应的接口
	 */
	function wrapperMethod(method){
		var defaults=Array.prototype.slice.call(arguments,1);
		return function(){
			return waitExecuteMethod(method,copy.apply(null,[null].concat(defaults,Array.prototype.slice.call(arguments))));
		}
	}
	/**
	*等待执行对应的方法 如果方法对应的 bridge 或 config 要求未满足 将插入等待队列 否则立即执行
	*@params method  string   wx的方法名称
	*@params args    object   method的参数
	*/
	function waitExecuteMethod(method,args){
		if(isWechat){
			var need=apiList[method];
			var flag=(need=='config')?hasConfig:eweixin.isBridge;
			var group=(need=='config')?waitConfigGroup:waitBridgeGroup;
			if(flag){
				if(isFunction(wx[method])){
					wx[method](args);
				}
			}else{
				group.push({method:method,args:args});
			}
		}
		return eweixin;
	}
	/*
	*根据 need 执行对应的等待队列方法
	*@params need   string   'bridge' or 'config' 
	*/
	function executeGroup(need){
		var group=(need=='config')?waitConfigGroup:waitBridgeGroup;
		while(group.length){
			var waitItem=group.shift();
			var method=wx[waitItem.method];
			var args=waitItem.args;
			if(isFunction(method)){
				method(args);
			}
		}
	}
	/**
	 * 修改参数信息
	 * @param   	source 		object 				被修改的信息对象 
	 * @param   	names  		array 				键名称数组
	 * @param   	key    		string 				修改的键名称
	 * @param   	value  		string|function		对应键的值
	 * @return      source 	
	 */
	function changeInfo(source,names,key,value){
		if(isUndefined(key)||key==='clear'){
			names.forEach(function(name){
				if(source.hasOwnProperty(name)){
					delete source[name];
				}
			});
		}else{
			if(!value){
				if(source.hasOwnProperty(key)){
					delete source[key];
				}
			}else if(source[key]!==value){
				source[key]=value;
			}
		}
		return copy(null,source);
	}
	/**
	 * 把 arguments 第二位开始往后的 object copy 到 dest 对象中 只做第一层对象的浅复制动作 参数越靠后优先级更高（同属性覆盖）
	 * @param  dest   	object  拷贝目的对象
	 * @return dest 	
	 */
	function copy(dest){
		var needEmpty=true;
		var sources;
		var args=Array.prototype.slice.call(arguments,1);
		if(!isObject(dest))dest={};
		if(args.length){
			sources=args.filter(function(item){
				var sameDest=(item===dest);
				if(sameDest){
					needEmpty=false;
				}
				return !sameDest
			});
			sources.unshift((needEmpty)?empty(dest):dest);
			return extend.apply(null,sources);
		}else{
			return dest;
		}
	}
	/**
	 * 把 arguments 中的对象属性扩展到 dest 对象中去
	 * @param  dest   	object  拷贝目的对象
	 * @return dest 	
	 */
	function extend(dest){
		if(arguments.length>1){
			if(!isObject(dest))dest={};
			var args=Array.prototype.slice.call(arguments,1);
			args.reduce(function(prev,current){
				if(isObject(current)&&prev!==current){
					for(var i in current){
						if(current.hasOwnProperty(i)){
							prev[i]=current[i];
						}
					}
				}
				return prev;
			},dest);
		}
		return dest;
	}
	/**
	 *清空 source 对象
	 *@params source Object|Array 被清空的对象
	 *@return source
	 */
	function empty(source){
		if(isArray(source)){
			source.splice(0,source.length);
		}else if(isObject(source)){
			for(var i in source){
				if(source.hasOwnProperty(i)){
					delete source[i];
				}
			}
		}
		return source;
	}
  	/**
  	 * WeixinJSBridge 链接成功后执行 bridge 等待队列
  	 */
	function onBridgeReady(){
		executeGroup('bridge');
	}
	/*在微信浏览器下判断侦听 WeixinJSBridge 是否已链接成功*/
	if(isWechat){
		if(eweixin.isBridge){
			onBridgeReady();
		}else{
			if (global.document.addEventListener) {
                global.document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
            } else if (global.document.attachEvent) {
                global.document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                global.document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
            }
		}
	}
	/*module export*/
	return eweixin;
});
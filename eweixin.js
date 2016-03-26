;(function(global,factory){
	if(typeof global !=='undefined'&&global.document&&global.self===global.top){
		if(typeof define==='function'&&define.amd){
			define(['jweixin'],function(wx){return factory(wx,global,global.document);});
		}else if(typeof module !== 'undefined' && module.exports){
			module.exports = factory(require('jweixin'),global,global.document);
		}else{
			global.eweixin=factory(global.wx,global,global.document);
		}
	}
})(typeof window !== 'undefined' ? window : this,function(wx,window,document){
  	/*判断是否是 array*/
  	var isArray=Array.isArray;
  	/*判断是否是空数组*/
  	var emptyArray=function(value){if(isArray(value)){return value.length===0;}else{return true;}}
	/*判断是否是 object*/
	var isObject=function(value){return value !== null&&!isArray(value) && typeof value === 'object';}
  	/*判断是否是 string*/
  	var isString=function(value){return typeof value === 'string';}
  	/*判断是否是 function*/
  	var isFunction=function(value){return typeof value==='function'}
  	/*判断是否是 undefined*/
  	var isUndefined=function(value){return typeof value==='undefined'}
  	/*所有的回调名称*/
  	var callBacks=['success','fail','complete','cancel','trigger'];
	/*WeixinJSBridge 连接后需要执行的等待方法队列*/
	var waitBridgeGroup=[];
	/*config 签名验证成功后需要执行的等待方法队列*/
	var waitCheckGroup=[];
	/*分享朋友圈参数记录*/
	var timelineContentsRecord={};
	var timelineCallbacksRecord={};
	/*分享给朋友参数记录*/
	var appmessageContentsRecord={};
	var appmessageCallbacksRecord={};
	/*分享到QQ参数记录*/
	var qqContentsRecord={};
	var qqCallbacksRecord={};
	/*分享到腾讯微博参数记录*/
	var weiboContentsRecord={};
	var weiboCallbacksRecord={};
	/*eweixin 对象*/
	var eweixin={
		/*分享类型常量*/
		TL:'timeline',AM:'appmessage',QQ:'qq',WB:'weibo',
		/*判断微信浏览器*/
		isWechat:(navigator.userAgent.toLowerCase().match(/MicroMessenger/i)=="micromessenger"),
		/*WeixinJSBridge 是否连接*/
		isBridge:false,
		/*是否通过签名验证(config)*/
		isCheck:false,
		/*所有的 api list*/
		jsApiList:[
	      'checkJsApi',
	      'onMenuShareTimeline',
	      'onMenuShareAppMessage',
	      'onMenuShareQQ',
	      'onMenuShareWeibo',
	      'hideMenuItems',
	      'showMenuItems',
	      'hideAllNonBaseMenuItem',
	      'showAllNonBaseMenuItem',
	      'translateVoice',
	      'startRecord',
	      'stopRecord',
	      'onRecordEnd',
	      'playVoice',
	      'pauseVoice',
	      'stopVoice',
	      'uploadVoice',
	      'downloadVoice',
	      'chooseImage',
	      'previewImage',
	      'uploadImage',
	      'downloadImage',
	      'getNetworkType',
	      'openLocation',
	      'getLocation',
	      'hideOptionMenu',
	      'showOptionMenu',
	      'closeWindow',
	      'scanQRCode',
	      'chooseWXPay',
	      'openProductSpecificView',
	      'addCard',
	      'chooseCard',
	      'openCard'   
	    ]
	};
    /**
	 *config 提交签名信息验证,并执行成功或失败回调
	 *@params configs           Object   签名信息
	 *		 configs.debug     boolean  (默认false)是否开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。             
     *		 configs.appId     string   (必填)公众号的唯一标识
     *		 configs.timestamp string   (必填)生成签名的时间戳(后端参与签名的时间戳)
     *		 configs.nonceStr  string   (必填)生成签名的随机串(后端参与签名的随机串)
     *		 configs.signature string   (必填)签名(后端计算出的签名信息)
     *		 configs.jsApiList array    (默认全部JS接口)需要使用的JS接口列表
     *@params success           function 验证成功后回调 
     *@params fail              function 验证失败后回调 
     *@return eweixin
     */
	eweixin.config=function(configs,success,fail){
		if(!isObject(configs)){
			fail&&fail({'errMsg':'config:invalid configs args'});
			return this;
		}
		/*经过测试发现 config验证发出后 会按照error ready添加的顺序执行 所以把wx.error 放第一位执行 如果验证成功不会执行error*/
		var noError=true;
		wx.error(function(msg){
			noError=false;
			eweixin.isCheck=false
			fail&&fail(msg);
		});
		wx.ready(function(msg){
			/*if(msg.errMsg==='config:ok'){eweixin.isCheck=true;executeGroup('check');success&&success(msg);}*/
			if(noError){
				eweixin.isCheck=true;
				executeGroup('check');
				success&&success(msg);
			}
		});
		/*填充默认属性调用 wx.config 进行验证*/
		if(isUndefined(configs.debug))configs.debug=false;
		configs.jsApiList=(isArray(configs.jsApiList))?configs.jsApiList:this.jsApiList;
		wx.config(configs);
		return this;
	}
	/**
	 *判断当前客户端版本是否支持指定JS接口(目前这接口怎么调都是ok的，也就是没啥用)
	 *@params arg            object    检测参数对象
	 *		 arg.jsApiList  array     需要检测的JS接口列表
	 *		 arg.success    function  检测回调函数，以键值对的形式返回，可用的api值true，不可用为false  如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@return eweixin
	 */
	eweixin.checkJsApi=function(arg,delsame){
		if(isObject(arg)&&!emptyArray(arg.jsApiList)){
			return asyncExecuteMethod(delsame,'bridge','checkJsApi',arg);
		}else{
			return this;
		}
	};
	/**
	 *隐藏右上角菜单接口
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.hideOptionMenu=function(delsame){
		return asyncExecuteMethod(delsame,'bridge','hideOptionMenu');
	}
	/**
	 *隐藏网页右上角的按钮
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.showOptionMenu=function(delsame){
		return asyncExecuteMethod(delsame,'bridge','showOptionMenu');
	}
	/**
	 *关闭当前网页窗口接口
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.closeWindow=function(delsame){
		return asyncExecuteMethod(delsame,'bridge','closeWindow');
	}
	/**
	 *批量隐藏功能按钮接口
	 *@params arg            object 参数对象
	 *        arg.menuList   array  需要隐藏的功能按钮数组
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.hideMenuItems=function(arg,delsame){
		if(isObject(arg)&&!emptyArray(arg.menuList)){
			return asyncExecuteMethod(delsame,'check','hideMenuItems',arg);
		}else{
			return this;
		}
	}
	/**
	 *批量显示功能按钮接口
	 *@params arg            object 参数对象
	 *        arg.menuList   array  需要隐藏的功能按钮数组
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.showMenuItems=function(arg,delsame){
		if(isObject(arg)&&!emptyArray(arg.menuList)){
			return asyncExecuteMethod(delsame,'check','showMenuItems',arg);
		}else{
			return this;
		}
	}
	/**
	 *隐藏所有非基础按钮接口
	 *@params callbacks            object 参数对象 回调处理
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.hideAllNonBaseMenuItem=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'check','hideAllNonBaseMenuItem',callbacks);
	}
	/**
	 *显示所有功能按钮接口
	 *@params callbacks            object 参数对象 回调处理
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.showAllNonBaseMenuItem=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'check','showAllNonBaseMenuItem',callbacks);
	}
	/**
	 *调起微信扫一扫接口
	 *@params arg                   object   参数对象
	 *        arg.needResult        number   默认为0，扫描结果由微信处理，1则直接返回扫描结果
	 *        calllbacks       success: function (res) {var result = res.resultStr; // 当needResult 为 1 时，扫码返回的结果}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.scanQRCode=function(arg,delsame){
		var defaultArg={desc:'scanQRCode desc',needResult:0,scanType: ['qrCode','barCode']};
		return asyncExecuteMethod(delsame,'check','scanQRCode',copy({},defaultArg,arg));
	}
	/**
  	 *获取网络状态接口
  	 *@params callbacks            object 参数对象 回调处理
  	 *eg: 
  	 *	success: function (res) {
     *  	var networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
     *	}
  	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.getNetworkType=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'bridge','getNetworkType',callbacks);
	}
	/**
	 *跳转微信商品页接口
	 *@params   arg               object     参数对象
	 *          arg.productId     string     商品id
	 *          arg.viewType      string     0.默认值，普通商品详情页1.扫一扫商品详情页2.小店商品详情页
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.openProductSpecificView=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','openProductSpecificView',arg);
	}
	/**
	 *调起适用于门店的卡券列表并获取用户选择列表
	 *@params   arg               object     参数对象
	 *          arg.shopId        string     门店Id
	 *          arg.cardType      string     卡券类型
	 *          arg.cardId        string     卡券Id
	 *          arg.timeStamp        number     卡券签名时间戳
	 *          arg.nonceStr        string     卡券签名随机串
	 *          arg.cardSign        string     卡券签名
	 *回调处理 eg: success: function (res) {var cardList= res.cardList; // 用户选中的卡券列表信息}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.chooseCard=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','chooseCard',arg);
	}
	/**
	 *批量添加卡券接口
	 *@params   arg               object     参数对象
	 *          arg.cardList        array     需要添加的卡券列表 eg: cardList: [{cardId: '',cardExt: ''}]
	 *回调处理 eg: success: function (res) { var cardList = res.cardList; // 添加的卡券列表信息}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.addCard=function(arg,delsame){
		if(isObject(arg)&&!emptyArray(arg.cardList)){
			return asyncExecuteMethod(delsame,'check','addCard',arg);
		}else{
			return this;
		}
	}
	/**
	 *查看微信卡包中的卡券接口
	 *@params   arg               object     参数对象
	 *          arg.cardList        array     需要打开的卡券列表 eg: cardList: [{cardId: '',code: ''}]
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.openCard=function(arg,delsame){
		if(isObject(arg)&&!emptyArray(arg.cardList)){
			return asyncExecuteMethod(delsame,'check','openCard',arg);
		}else{
			return this;
		}
	}
	/**
	 *发起一个微信支付请求
	 *@params   arg               object     参数对象
	 *          arg.timestamp      number    支付签名时间戳
	 *          arg.noncestr      string    支付签名随机串
	 *          arg.package      string    订单详情扩展字符串
	 *          arg.paySign      string    支付签名
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.chooseWXPay=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','chooseWXPay',arg);
	}
	/**
	 *使用微信内置地图查看位置接口
	 *@params   arg               object     参数对象
	 *          arg.latitude      number    纬度，浮点数，范围为90 ~ -90
	 *          arg.longitude      number    经度，浮点数，范围为180 ~ -180。
	 *          arg.name         string    位置名
	 *          arg.address      string     地址详情说明
	 *          arg.scale      number     地图缩放级别,整形值,范围从1~28。默认为最大
	 *          arg.infoUrl      string     在查看位置界面底部显示的超链接,可点击跳转
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.openLocation=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','openLocation',arg);
	}
	/**
	 *获取地理位置接口
	 *@params   arg               object     参数对象
	 *          arg.timestamp      number     位置签名时间戳，仅当需要兼容6.0.2版本之前时提供
	 *          arg.nonceStr      string     位置签名随机串，仅当需要兼容6.0.2版本之前时提供
	 *          arg.addrSign       string    位置签名，仅当需要兼容6.0.2版本之前时提供
	 *回调 eg: 
	 *success: function (res) {
     *   var longitude = res.longitude; // 纬度，浮点数，范围为90 ~ -90
     *   var latitude = res.latitude; // 经度，浮点数，范围为180 ~ -180。
     *   var speed = res.speed; // 速度，以米/每秒计
     *   var accuracy = res.accuracy; // 位置精度
     * }
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.getLocation=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','getLocation',arg);
	}
	/**
	 *预览图片接口
	 *@params arg         object 参数对象
	 *        arg.current string 当前显示的图片链接
	 *        arg.urls    array  需要预览的图片链接列表
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.previewImage=function(arg,delsame){
		return asyncExecuteMethod(delsame,'bridge','previewImage',arg);
	}
	/**
	 *拍照或从手机相册中选图接口
	 *@params callbacks           object    回调集合(查看callBacks)
	 *        callbacks.success   function  操作成功回调  function (res) {var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.chooseImage=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'check','chooseImage',callbacks);
	}
	/**
	 *上传图片接口
	 *@params arg                     object  参数集合
	 *        arg.localId             string  需要上传的图片的本地ID，由chooseImage接口获得
	 *        arg.isShowProgressTips  number  默认为1，显示进度提示
	 *        arg.success |arg.fail |arg.complete |arg.cancel | function 回调函数  success: function (res) {var serverId = res.serverId; // 返回图片的服务器端ID}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.uploadImage=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','uploadImage',arg);
	}
	/**
	 *下载图片接口
	 *@params arg                     object  参数集合
	 *        arg.serverId            string  需要下载的图片的服务器端ID，由uploadImage接口获得
	 *        arg.isShowProgressTips  number  默认为1，显示进度提示
	 *        arg.success |arg.fail |arg.complete |arg.cancel | function 回调函数 success: function (res) {var localId = res.localId; // 返回图片下载后的本地ID}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.downloadImage=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','downloadImage',arg);
	}
	/**
 	 *开始录音接口
 	 *@params callbacks            object 参数对象 回调处理
 	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.startRecord=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'check','startRecord',callbacks);
	}
	/**
 	 *停止录音接口
 	 *@params callbacks            object 参数对象 回调处理
 	 *eg:
 	 * success: function (res) {
     *   	var localId = res.localId;
     *	}
 	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.stopRecord=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'check','stopRecord',callbacks);
	}
	/**
 	 *监听录音自动停止接口(录音时间超过一分钟没有停止的时候会执行 complete 回调)
 	 *@params callbacks            object 参数对象 回调处理
 	 *eg:
 	 * complete: function (res) {
     *   	var localId = res.localId;
     *	}
 	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.onVoiceRecordEnd=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'check','onVoiceRecordEnd',callbacks);
	}
	/**
 	 *播放语音接口
 	 *@params arg            object 参数对象
 	 *        arg.localId    string 需要播放的音频的本地ID，由stopRecord|onVoiceRecordEnd接口获得
 	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.playVoice=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','playVoice',arg);
	}
	/**
 	 *暂停播放接口
 	 *@params arg            object 参数对象
 	 *        arg.localId    string 需要暂停的音频的本地ID，由stopRecord|onVoiceRecordEnd接口获得
 	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.pauseVoice=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','pauseVoice',arg);
	}
	/**
 	 *停止播放接口
 	 *@params arg            object 参数对象
 	 *        arg.localId    string  需要停止的音频的本地ID，由stopRecord|onVoiceRecordEnd接口获得
 	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.stopVoice=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','stopVoice',arg);
	}
	/**
	 *监听语音播放完毕接口
	 *@params  callbacks  object 回调集合
	 * eg: complete: function (res) {alert('音频（' + res.localId + '）播放结束');}    
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin 
	 */
	eweixin.onVoicePlayEnd=function(callbacks,delsame){
		return asyncExecuteMethod(delsame,'check','onVoicePlayEnd',callbacks);
	}
	/**
	 *上传语音接口
	 *@params  arg                      object      参数集合
	 *         arg.localId              string      需要上传的音频的本地ID，由stopRecord|onVoiceRecordEnd接口获得
	 *         arg.isShowProgressTips   number      默认为1，显示进度提示
	 *回调处理 eg:   success: function (res) {var serverId = res.serverId; // 返回音频的服务器端ID}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin    
	 */
	eweixin.uploadVoice=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','uploadVoice',arg);
	}
	/**
	 *下载语音接口
	 *@params  arg                      object      参数集合
	 *         arg.serverId              string      需要下载的音频的服务器端ID，由uploadVoice接口获得
	 *         arg.isShowProgressTips   number      默认为1，显示进度提示
	 *回调处理 eg:   success: function (res) {var localId = res.localId; // 返回音频的本地ID}
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin    
	 */
	eweixin.downloadVoice=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','downloadVoice',arg);
	}
	/**
	 *识别音频并返回识别结果接口
	 *@params  arg                      object      参数集合
	 *         arg.localId              string      需要识别的音频的本地Id，由录音相关接口获得
	 *回调处理 eg:   
	 *complete: function (res) {
     *   if (res.hasOwnProperty('translateResult')) {
     *     alert('识别结果：' + res.translateResult);
     *   } else {
     *     alert('无法识别');
     *   }
     * }
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin    
	 */
	eweixin.translateVoice=function(arg,delsame){
		return asyncExecuteMethod(delsame,'check','translateVoice',arg);
	}
	/**
	 *客制分享到朋友圈内容，以及捕获分享状态
	 *contents callbacks 做了自动分类，也就是说如果你把回调都写在contents中或把内容都写在callbacks中也能按你的预期执行
	 *@params contents            object    内容参数对象
	 *        contents.title      string    标题
	 *        contents.link       string    链接
	 *        contents.imgUrl     string    图片地址
	 *@params callbacks           object    回调参数对象
	 *        callbacks.success    function  分享成功回调
	 *        callbacks.fail       function  分享失败回调
	 *        callbacks.complete   function  无论成功或失败都回调
	 *        callbacks.cancel     function  取消分享回调
	 *        callbacks.trigger    function  点击分享朋友圈按钮回调
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.onMenuShareTimeline=function(contents,callbacks,delsame){
		classify(timelineContentsRecord,timelineCallbacksRecord,contents,callbacks);
		timelineContentsRecord.title=timelineContentsRecord.desc||timelineContentsRecord.title;
		return asyncExecuteMethod(delsame,'check','onMenuShareTimeline',copy({},timelineContentsRecord,timelineCallbacksRecord));
	}
	/**
	 *改变分享到朋友圈的内容
	 *@params key   string 需要改变的参数名 title/link/imgUrl等 如果传入 'clear' 则清空所有的内容参数
	 *@params value string 对应key的值
	 *@retrun eweixin
	 */
	eweixin.timelineChangeContent=function(key,value){
		if(key==='clear'){
			empty(timelineContentsRecord);
		}else if(!isUndefined(key)){
			timelineContentsRecord[key]=value;
		}
		return this.onMenuShareTimeline(copy({},timelineContentsRecord),copy({},timelineCallbacksRecord));
	}
	/**
	 *改变分享到朋友圈的回调
	 *@params key   string 需要改变的参数名 success/cancel/等 如果传入 'clear' 则清空所有的回调参数
	 *@params value function 对应key的回调函数
	 *@return eweixin
	 */
	eweixin.timelineChangeCallback=function(key,value){
		if(key==='clear'){
			empty(timelineCallbacksRecord);
		}else if(!isUndefined(key)){
			timelineCallbacksRecord[key]=value;
		}
		return this.onMenuShareTimeline(copy({},timelineContentsRecord),copy({},timelineCallbacksRecord));
	}
	/**
	 *客制分享给朋友的内容，以及捕获分享状态
	 *contents callbacks 做了自动分类，也就是说如果你把回调都写在contents中或把内容都写在callbacks中也能按你的预期执行
	 *@params contents            object    内容参数对象
	 *        contents.title      string    标题
	 *        contents.desc       string    描述
	 *        contents.link       string    链接
	 *        contents.imgUrl     string    图片地址
	 *        contents.type       string    分享类型,music、video或link，不填默认为link
	 *        contents.dataUrl    string    如果type是music或video，则要提供数据链接，默认为空
	 *@params callbacks           object    回调参数对象
	 *        callbacks.success    function  分享成功回调
	 *        callbacks.fail       function  分享失败回调
	 *        callbacks.complete   function  无论成功或失败都回调
	 *        callbacks.cancel     function  取消分享回调
	 *        callbacks.trigger    function  点击分享朋友按钮回调
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.onMenuShareAppMessage=function(contents,callbacks,delsame){
		classify(appmessageContentsRecord,appmessageCallbacksRecord,contents,callbacks);
		return asyncExecuteMethod(delsame,'check','onMenuShareAppMessage',copy({},appmessageContentsRecord,appmessageCallbacksRecord));
	}
	/**
	 *改变分享给朋友的内容
	 *@params key   string 需要改变的参数名 title/link/imgUrl等 如果传入 'clear' 则清空所有的内容参数
	 *@params value string 对应key的值
	 *@return eweixin
	 */
	eweixin.appmessageChangeContent=function(key,value){
		if(key==='clear'){
			empty(appmessageContentsRecord);
		}else if(!isUndefined(key)){
			appmessageContentsRecord[key]=value;
		}
		return this.onMenuShareAppMessage(copy({},appmessageContentsRecord),copy({},appmessageCallbacksRecord));
	}
	/**
	 *改变分享给朋友的回调
	 *@params key   string 需要改变的参数名 success/cancel/等 如果传入 'clear' 则清空所有的回调参数
	 *@params function 对应key的回调函数
	 *@return eweixin
	 */
	eweixin.appmessageChangeCallback=function(key,value){
		if(key==='clear'){
			empty(appmessageCallbacksRecord);
		}else if(!isUndefined(key)){
			appmessageCallbacksRecord[key]=value;
		}
		return this.onMenuShareAppMessage(copy({},appmessageContentsRecord),copy({},appmessageCallbacksRecord));
	}
	/**
	 *客制分享到QQ的内容，以及捕获分享状态
	 *contents callbacks 做了自动分类，也就是说如果你把回调都写在contents中或把内容都写在callbacks中也能按你的预期执行
	 *@params contents            object    内容参数对象
	 *        contents.title      string    标题
	 *        contents.desc       string    描述
	 *        contents.link       string    链接
	 *        contents.imgUrl     string    图片地址
	 *@params callbacks           object    回调参数对象
	 *        callbacks.success    function  分享成功回调
	 *        callbacks.fail       function  分享失败回调
	 *        callbacks.complete   function  无论成功或失败都回调
	 *        callbacks.cancel     function  取消分享回调
	 *        callbacks.trigger    function  点击分享朋友按钮回调
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.onMenuShareQQ=function(contents,callbacks,delsame){
		classify(qqContentsRecord,qqCallbacksRecord,contents,callbacks);
		return asyncExecuteMethod(delsame,'check','onMenuShareQQ',copy({},qqContentsRecord,qqCallbacksRecord));
	}
	/**
	 *改变分享到QQ的内容
	 *@params key   string 需要改变的参数名 title/link/imgUrl等 如果传入 'clear' 则清空所有的内容参数
	 *@params value string 对应key的值
	 *@return eweixin
	 */
	eweixin.qqChangeContent=function(key,value){
		if(key==='clear'){
			empty(qqContentsRecord);
		}else if(!isUndefined(key)){
			qqContentsRecord[key]=value;
		}
		return this.onMenuShareQQ(copy({},qqContentsRecord),copy({},qqCallbacksRecord));
	}
	/**
	 *改变分享到QQ的回调
	 *@params key   string 需要改变的参数名 success/cancel/等 如果传入 'clear' 则清空所有的回调参数
	 *@params function 对应key的回调函数
	 *@return eweixin
	 */
	eweixin.qqChangeCallback=function(key,value){
		if(key==='clear'){
			empty(qqCallbacksRecord);
		}else if(!isUndefined(key)){
			qqCallbacksRecord[key]=value;
		}
		return this.onMenuShareQQ(copy({},qqContentsRecord),copy({},qqCallbacksRecord));
	}
	/**
	 *客制分享到腾讯微博的内容，以及捕获分享状态
	 *contents callbacks 做了自动分类，也就是说如果你把回调都写在contents中或把内容都写在callbacks中也能按你的预期执行
	 *@params contents            object    内容参数对象
	 *        contents.title      string    标题
	 *        contents.desc       string    描述
	 *        contents.link       string    链接
	 *        contents.imgUrl     string    图片地址
	 *@params callbacks           object    回调参数对象
	 *        callbacks.success    function  分享成功回调
	 *        callbacks.fail       function  分享失败回调
	 *        callbacks.complete   function  无论成功或失败都回调
	 *        callbacks.cancel     function  取消分享回调
	 *        callbacks.trigger    function  点击分享朋友按钮回调
	 *@params delsame    boolean      是否把等待数组中的同名方法清除 默认true 清空
	 *@retrun eweixin
	 */
	eweixin.onMenuShareWeibo=function(contents,callbacks,delsame){
		classify(weiboContentsRecord,weiboCallbacksRecord,contents,callbacks);
		return asyncExecuteMethod(delsame,'check','onMenuShareWeibo',copy({},weiboContentsRecord,weiboCallbacksRecord));
	}
	/**
	 *改变分享到腾讯微博的内容
	 *@params key   string 需要改变的参数名 title/link/imgUrl等 如果传入 'clear' 则清空所有的内容参数
	 *@params value string 对应key的值
	 *@return eweixin
	 */
	eweixin.weiboChangeContent=function(key,value){
		if(key==='clear'){
			empty(weiboContentsRecord);
		}else if(!isUndefined(key)){
			weiboContentsRecord[key]=value;
		}
		return this.onMenuShareWeibo(copy({},weiboContentsRecord),copy({},weiboCallbacksRecord));
	}
	/**
	 *改变分享到腾讯微博的回调
	 *@params key   string 需要改变的参数名 success/cancel/等 如果传入 'clear' 则清空所有的回调参数
	 *@params function 对应key的回调函数
	 *@return eweixin
	 */
	eweixin.weiboChangeCallback=function(key,value){
		if(key==='clear'){
			empty(weiboCallbacksRecord);
		}else if(!isUndefined(key)){
			weiboCallbacksRecord[key]=value;
		}
		return this.onMenuShareWeibo(copy({},weiboContentsRecord),copy({},weiboCallbacksRecord));
	}
	/**
	 *统一设置分享内容以及回调处理
	 *@params type      string  eweixin.TL|eweixin.AM|eweixin.QQ|eweixin.WB|设置对应的类型分享，其它情况设置所有的分享
	 *@params contents  object  参照onMenuShareTimeline|onMenuShareAppMessage|onMenuShareQQ|onMenuShareWeibo 的contents参数
	 *@params callbacks object  参照onMenuShareTimeline|onMenuShareAppMessage|onMenuShareQQ|onMenuShareWeibo 的callbacks参数
	 *@return eweixin
	 */
	eweixin.setShare=function(type,contents,callbacks){
		switch(type){
			case this.TL:
				this.onMenuShareTimeline(contents,callbacks);
				break;
			case this.AM:
				this.onMenuShareAppMessage(contents,callbacks);
				break;
			case this.QQ:
				this.onMenuShareQQ(contents,callbacks);
				break;
			case this.WB:
				this.onMenuShareWeibo(contents,callbacks);
				break;
			default:
				this.onMenuShareTimeline(contents,callbacks);
				this.onMenuShareAppMessage(contents,callbacks);
				this.onMenuShareQQ(contents,callbacks);
				this.onMenuShareWeibo(contents,callbacks);
				break;
		}
		return this;
	}
	/**
	 *统一改变分享的内容
	 *@params type   string  eweixin.TL|eweixin.AM|eweixin.QQ|eweixin.WB|修改对应的类型分享内容，其它情况修改所有的分享内容
	 *@params key    string 需要改变的参数名 title/link/imgUrl等 如果传入 'clear' 则清空所有的内容参数
	 *@params value  string 对应key的值
	 *@return eweixin
	 */
	eweixin.changeContent=function(type,key,value){
		switch(type){
			case this.TL:
				this.timelineChangeContent(key,value);
				break;
			case this.AM:
				this.appmessageChangeContent(key,value);
				break;
			case this.QQ:
				this.qqChangeContent(key,value);
				break;
			case this.WB:
				this.weiboChangeContent(key,value);
				break;
			default:
				this.timelineChangeContent(key,value);
				this.appmessageChangeContent(key,value);
				this.qqChangeContent(key,value);
				this.weiboChangeContent(key,value);
				break;
		}
		return this;
	}
	/**
	 *统一改变分享的回调
	 *@params type   string  eweixin.TL|eweixin.AM|eweixin.QQ|eweixin.WB|修改对应的类型分享回调，其它情况修改所有的分享回调
	 *@params key   string 需要改变的参数名 success/cancel/等 如果传入 'clear' 则清空所有的回调参数
	 *@params function 对应key的回调函数
	 *@return eweixin
	 */
	eweixin.changeCallback=function(type,key,value){
		switch(type){
			case this.TL:
				this.timelineChangeCallback(key,value);
				break;
			case this.AM:
				this.appmessageChangeCallback(key,value);
				break;
			case this.QQ:
				this.qqChangeCallback(key,value);
				break;
			case this.WB:
				this.weiboChangeCallback(key,value);
				break;
			default:
				this.timelineChangeCallback(key,value);
				this.appmessageChangeCallback(key,value);
				this.qqChangeCallback(key,value);
				this.weiboChangeCallback(key,value);
				break;
		}
		return this;
	}
	/*
	*异步执行对应的方法 如果条件不满足将插入等待队列 否则立即执行
	*@params delsame boolean  当进入等待队列时是否清除重复的接口等待，有些接口不宜在等待队列出现多次
	*@params type   string   'bridge' or 'check' 标志该method需要的条件是  WeixinJSBridgeReady 还是 验证成功
	*@params method string   wx的方法名称
	*@params arg    object   method的参数
	*/
	function asyncExecuteMethod(delsame,type,method,arg){
		if(!eweixin.isWechat)return eweixin;
		var flag=(type=="check")?eweixin.isCheck:eweixin.isBridge;
		var group=(type=="check")?waitCheckGroup:waitBridgeGroup;
		if(flag){
			wx[method]&&wx[method](arg);
		}else{
			if(isUndefined(delsame)||delsame)delSameInGroup(method,group);
			var wait={method:method,arg:arg};
			group.push(wait);
		}
		return eweixin;
	}
	/*把 group 数组中method key值 等于 method参数的项删除*/
	function delSameInGroup(method,group){
		var hasSame=false;
		if(!isArray(group)||!group.length)return hasSame;
		var groupLength=group.length-1;
		for(var j=groupLength;j>=0;j--){
			var wait=group[j];
			if(wait.method===method){
				hasSame=true;
				group.splice(j,1);
			}
		}
		return hasSame;
	}
	/*
	*根据type执行对应的等待队列方法
	*@params type   string   'bridge' or 'check' 
	*/
	function executeGroup(type){
		var group=(type=="check")?waitCheckGroup:waitBridgeGroup;
		while(group.length){
			var wait=group.shift();
			var method=wait.method;
			var arg=wait.arg;
			wx[method]&&wx[method](arg);
		}
	}
	/*把 arguments 中的 object 对象的属性copy到 dst 对象中，arguments靠后的对象属性会覆盖靠前的对象属性 本方法只做一层copy*/
	function copy(dst){
		dst=(isObject(dst))?dst:{};
		for(var i=1;i<arguments.length;i++){
			var obj=arguments[i];
			if(isObject(obj)){
				for(var j in obj)dst[j]=obj[j];
			}
		}
		return dst;
	}
	/**
	 *清空 source 对象
	 *@params source Object|Array 被清空的对象
	 *@return source
	 */
	function empty(source){
		if(isArray(source)){
			while(source.length)source.shift();
		}else if(isObject(source)){
			for(var i in source)delete source[i];
		}
		return source;
	}
	/*归类 content和callback 比如content中有success key 则把这个key-value 分配给callback*/
	function classify(contentRecord,callbackRecord,content,callback){
		empty(contentRecord);
		empty(callbackRecord);
		if(isObject(content))copy(contentRecord,content);
		if(isObject(callback))copy(callbackRecord,callback);
		for(var i in contentRecord){
			if(~callBacks.indexOf(i)){
				if(isFunction(contentRecord[i])&&!isFunction(callbackRecord[i]))callbackRecord[i]=contentRecord[i];
				delete contentRecord[i];
			}
		}
		for(var j in callbackRecord){
			if(!~callBacks.indexOf(j)){
				if(!contentRecord[j]||!isString(contentRecord[j]))contentRecord[j]=callbackRecord[j];
				delete callbackRecord[j];
			}
		}
	}
  	/*WeixinJSBridge 连接后侦听函数*/
	function onBridgeReady(){
		eweixin.isBridge=true;
		executeGroup('bridge');
	}
	/*在微信浏览器下判断侦听 WeixinJSBridge 对象是否已连接*/
	if(eweixin.isWechat){
		if(!isUndefined(window.WeixinJSBridge)){
			onBridgeReady();
		}else{
			if (document.addEventListener) {
                document.addEventListener('WeixinJSBridgeReady', onBridgeReady, false);
            } else if (document.attachEvent) {
                document.attachEvent('WeixinJSBridgeReady', onBridgeReady);
                document.attachEvent('onWeixinJSBridgeReady', onBridgeReady);
            }
		}
	}
	/*module export*/
	return eweixin;
});
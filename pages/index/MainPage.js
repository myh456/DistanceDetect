Page({
	data: {
		src: '',										// 用于保存照片地址
		length: 0.0,									// 用于保存距离并回显到UI界面
		base64Str: "",									// 用于保存照片转码后的base64编码
		f: 630,											// 用于保存默认的相机焦距
		left: [0, 0],									// 用于保存两次测量时人脸距屏幕左侧的数据
		angle: [0, 0]									// 用于保存两次测量时手机的倾斜角度
	},
	onLoad: function () {								
		this.Camerax = wx.createCameraContext();
  },
  /**
   * 用于拍照
   */
	lock: function () {
		this.Camerax.takePhoto({
			quality: 'high',						
			success: (res) => {					
				this.setData({						
					src: res.tempImagePath
				}, () => {							
					this.encode(this.data.src);	
				})
			}
		})
  },
  /**
   * 用于图片转base64
   * @param {string} filePath
   */
	encode(filePath) {
		console.log(filePath + "开始转码");	
		let fs = wx.getFileSystemManager();
		fs.readFile({
			filePath: filePath,
			encoding: "base64",
			success: (res) => {
				this.setData({
					base64Str: res.data
				})
				this.getAccessToken();
			},
			fail: () => {
				wx.showToast({
					title: '转化图片失败了'
				})
			}
		})
  },
  /**
   * 从百度AI接口获取token
   */
	getAccessToken() {
		console.log("开始获取token");
		wx.request({
			url: 'https://aip.baidubce.com/oauth/2.0/token',
			data: {
				'grant_type': 'client_credentials',
				"client_id": "stRN7mbhxq1nFuoMbSqlxjZG",
				"client_secret": "ivzLFnITb6Np3QQl2ptyqTlDsBdPWIjm"
			},
			success: (res) => {
				this.getFaceInfo(res.data.access_token);
			},
			fail: (err) => {
				console.log(err);
			}
		})
  },
  /**
   * 通过token和人脸照片的base64向百度AI申请分析人脸相关数据
   * @param {string} token 
   */
	getFaceInfo(token) {
		wx.request({
			method: "POST",	
			url: 'https://aip.baidubce.com/rest/2.0/face/v3/detect?access_token=' + token,
			data: {
				image: this.data.base64Str,
				image_type: "BASE64"
			},
			header: {
				"Content-Type": "application/json"
			},
			success: (res) => {
				if (res.data.error_code === 0) {							// 百度智能云成功从图片中分析出人脸及相关数据
					this.setData({
						left: [this.data.left[1], res.data.result.face_list[0].location.left]		//存入获取到的数据
					})
					console.log("left ==> " + this.data.left);
					this.measureAngle();
				} else {
					wx.showToast({
						title: '请求数据失败！',
					})
				}
			}
		})
  },
  /**
   * 监听手机加速度计，获取手机倾斜角
   */
	measureAngle() {
		wx.startAccelerometer({
			success: () => {
				wx.onAccelerometerChange((res) => {
					let x = Math.abs(res.x * Math.PI / 2);
					let y = Math.abs(res.y * Math.PI / 2);
					let a = Math.abs(Math.atan2(y, x));	
					a = Number(a.toFixed(2));	
					this.setData({
						angle: [this.data.angle[1], a]
					})
					console.log("angle ==> " + this.data.angle);
					wx.stopAccelerometer();
				})
			}
		})
  },
  /**
   * 当完成两次测量后，计算人脸与手机的距离
   */
	testLength: function () {
		var d = Math.abs(this.data.left[0] - this.data.left[1]);			// 根据left计算视差
		var b = Math.sqrt(2 * 27 * 27 * (1 - Math.cos(this.data.angle[0] + this.data.angle[1])));		// 根据angle计算基线长度
		this.setData({
			length: Number((this.data.f * b / d).toFixed(2))
		})
		console.log(this.data.length);
	}
})
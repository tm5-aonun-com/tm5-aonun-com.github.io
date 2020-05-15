const EVENT_TYPE = 'dropfile';

class DropFile {

	constructor(div, delay=200) {
		if('inited' in DropFile) {

		}else{
			Object.defineProperty(DropFile, 'inited', { value: true });
			self.addEventListener('dragover', this.preventDefault);
			self.addEventListener('drop', this.preventDefault);
		}

		Object.defineProperties(this, {
			_target: { value: div },
			_on: { value: false, writable:true },
			_off: { value: true, writable:true },
			_callback: { value: undefined, writable:true },
			_delay: { value: Math.max(200,delay), writable:true },
		});
	}

	start(callback) {
		if (this._on) return ;
		this._on = true;
		this._off = false;
		this._target.addEventListener('dragover', this.preventDefault);
		this._target.addEventListener('drop', this.onDrop);

		this.callback(callback);
	}

	stop() {
		if (this._off) return ;
		this._on = false;
		this._off = true;
		this._target.removeEventListener('dragover', this.preventDefault);
		this._target.removeEventListener('drop', this.onDrop);
		
		if(this._callback) self.removeEventListener(EVENT_TYPE, this._callback);
	}

	callback(callback) {
		if(callback instanceof Function) {
			if(this._callback) self.removeEventListener(EVENT_TYPE, this._callback);
			this._callback = (e)=>{
				if(e.originalEvent.target === this._target) {
					let event = e;
					callback(e);
				}
			};
			self.addEventListener(EVENT_TYPE, this._callback);
		}else{
			return this._callback;
		}
	}

	preventDefault(event) {
		event.preventDefault();// 必须这么做，否则drop时会跳转页面。
		//event.stopInmediatePropagation();
		//event.stopPropagation();
	}

	async onDrop(event) {
		event.preventDefault();
		event.stopPropagation();

		let result = { array: [], object: {}, length: 0 };// 用于保存结果
		let timeoutEvent;
		
		function triggerTimeoutEvent() {
			clearTimeout(timeoutEvent);
			timeoutEvent = setTimeout(() => {
				let customizeEvent = new Event(EVENT_TYPE);
				customizeEvent.originalEvent = event;
				customizeEvent.data = result;
				window.dispatchEvent(customizeEvent);
			}, 200);// 大约延迟200秒即可
		}

		// [DragEvent]
		// @ event.dataTransfer.files          FileList { item(), get length, }
		// files的功能非常少，最大缺陷就是无法遍历目录，只适合处理拖拽进来的文件。
		// 代码：
		// let { files } = event.dataTransfer;
		// for (let i = 0, len = files.length; i < len; i++) {
		// 	let file = files[i]
		// 	log('<files>', i, len, file.name, file.size, file.type, file.lastModified);
		// }

		// @ event.dataTransfer.items      DataTransferItemList { add(), clear(), remove(), get length, }
		// items功能强大，可遍历目录。（还有增删函数，但好像没有作用。根据是我调用了clear，却没有清空items。）
		let { items } = event.dataTransfer;
		for (let i = 0, len = items.length; i < len; i++) {
			let item = items[i];
			let entry = item.webkitGetAsEntry();
			// log(entry);// { isFile:true, isDirectory:flase, name:'a.txt', fullPath:'/a.txt', filesystem, createWriter() }
			if (entry.isFile) {
				// 拖拽内容为文件
				let file = item.getAsFile();
				file.fullPath = entry.fullPath;// 对原始值扩展一个属性(全路径)
				// log(item);// { kind:'file', type:'text/plain', getAsString(), getAsFile(), webkitGetAsEntry() }
				// log(file);// {name:'a.txt', lastModified:1586833056086, lastModifiedDate, webkitRelativePath, size:558, type:'text/plain' }
				// log(item.type === file.type);
				// 保存结果
				collectResult(entry.fullPath, file);
			} else if (entry.isDirectory) {
				// 拖拽内容为目录
				entry.getDirectory(entry.fullPath, {}, readdirOnSuccess, readdirOnError);
			} else {
				console.error('未知类型', item.kind, item.type);
			}
			triggerTimeoutEvent();
		}

		// 读取dirEntry的函数
		function readdirOnSuccess(dirEntry) {
			dirEntry.createReader().readEntries((entries) => {
				for (let e of entries) {
					if (e.isFile) {
						// log('文件', e.name, e.fullPath)
						e.file(file => {
							// log(e.fullPath)
							file.fullPath = e.fullPath;// 设置全路径
							// 保存结果
							collectResult(e.fullPath, file);
						});
					} else {
						// log('目录', e.name, e.fullPath)
						readdirOnSuccess(e);// 循环调用
					}
					triggerTimeoutEvent();
				}
			})
		}

		function collectResult(fullPath, file) {
			result.array.push(file);
			result.object[fullPath] = file;
			result.length += 1;
		}

		// 读取目录失败时
		function readdirOnError(err) {
			console.error(err, arguments);
		}
	}
}



export default DropFile;

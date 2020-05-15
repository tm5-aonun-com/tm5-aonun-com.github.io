import cp from '/module/create-promise.js';

const CACHES = {};

function loader(url, opts) {
	if (url in CACHES) {
		return CACHES[url];
	}

	opts = Object.assign({ method: 'GET' }, opts);
	let ext = '';
	let { type, method, headers } = opts;
	if (!type) {
		let i = url.lastIndexOf('.');
		if (i > -1) {
			ext = url.slice(i + 1);
			if (ext === 'json') {
				type = 'json';
			} else if (ext === 'html' || ext === 'htm') {
				type = 'document';
			} else if (ext === 'txt') {
				type = 'text';
			} else {
				type = 'blob';
			}
		} else {
			type = 'text';
		}
	}

	let p = cp();
	CACHES[url] = p;
	let req = new XMLHttpRequest();
	p.request = req;
	req.open(method, url);
	req.responseType = type;// arrayBuffer | blob | document | json | text
	if (headers) {
		for (let k in headers) {
			req.setRequestHeader(k, headers[k]);
		}
	}
	req.addEventListener('abort', p.reject);
	req.addEventListener('error', p.reject);
	req.addEventListener('timeout', p.reject);
	req.addEventListener('loadend', function (e) {
		if (req.status === 200) {
			p.resolve(req.response);// json类型会静默反馈null
		} else {
			//console.error(req.status, req.responseURL);
			p.resolve(null);
		}
	});
	req.send();

	p.abort = req.abort.bind(req);
	p.header = req.setRequestHeader.bind(req);
	p.open = req.open.bind(req);
	p.send = req.send.bind(req);
	p.mimeType = req.overrideMimeType.bind(req);
	p.responseHeader = req.getResponseHeader.bind(req);

	let responseHeaders;
	let responseHeadersTemp = {};
	Object.defineProperty(p, 'responseHeaders', {
		get() {
			if (responseHeaders) {
				return responseHeaders;// 反馈缓存结果
			} else {
				let text = req.getAllResponseHeaders();
				if (text) {
					req.getAllResponseHeaders().split(/\r?\n/).forEach(row => {
						let [k, v] = row.split(/: /);
						responseHeadersTemp[k] = v;
					});
					responseHeaders = responseHeadersTemp;
					return responseHeaders;// 第一次下载完成时缓存
				} else {
					return null;// 没有下载完成时
				}
			}
		}
	});

	p.on = req.addEventListener.bind(req);
	p.off = req.removeEventListener.bind(req);
	return p;
};

function parseDocument(v) {
	return Array.from(v.body.children).map(e => e.cloneNode(true));
}

loader.parseDocument = parseDocument;




import JSZip from '/module/jszip.js';
function zip(url) {
	return fetch(url)
		.then(res => res.blob())
		.then(blob => {
			return blob.arrayBuffer();
		})
		.then(buffer => {
			return db.files.setItem(similarsFilename, buffer);
		})
		.then(buffer => {
			debug(buffer)
			let zip = new JSZip();
			zip.load(buffer);
			// return zip.file('tera.txt').asText();
			return zip;
		});
}

function json(url) {
	//采用fetch实现，与loader不同
	return fetch(url).then(function (res) {
		if (res.ok) {
			return res.json().then(function (data) {
				return data;
			}, function (err) {
				console.error(err);
				return null;
			});
		}
		return null;
	}, function (err) {
		console.log(11111);
	}).catch(function (err) {
		console.log(2222);
	});
};

function css(url, added = true) {
	return loader(url, { type: 'text' }).then(function (text) {
		let e = document.createElement('style');
		e.textContent = text;

		if(added instanceof Element) {
			added.appendChild(e);
		}else if(added) {
			document.head.appendChild(e);
		}
		return e;
	});
}


loader.json = json;
loader.zip = zip;
loader.css = css;

export default loader;

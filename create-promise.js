function createPromise() {
	let o = {};
	let p = new Promise(function(resolve, reject){
		o.resolve = resolve;
		o.reject = reject;
	});
	p.resolve = o.resolve;
	p.reject = o.reject;
	return p;
}

export default createPromise;
export { createPromise };

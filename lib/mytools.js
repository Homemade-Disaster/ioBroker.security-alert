const words = require('../admin/words');


//Delete leading dots
function getPrefixPath(path) {
	return path.replace(/^\.+/, '');
}

// add and get sortet array
function getSortedArray(name, id, list, listArray) {
	list = {};
	listArray[listArray.length + 1] = new Array(name, id);
	listArray.sort();
	listArray.forEach(([value, key]) => {
		list[key] = value;
		//this.log.debug('ArraySort: ' + key + ' - ' + value);
	});
	return {
		list: list,
		listArray: listArray,
	};
}

//translate
function tl(word, systemLang) {
	if (words[word]) {
		return words[word][systemLang] || words[word].en;
	} else {
		console.warn('Please translate in words.js: ' + word);
		return word;
	}
}

module.exports = {
	getPrefixPath,
	getSortedArray,
	tl
};

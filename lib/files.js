const fs = require('fs');
const path = require('path');
const ncp = require('ncp').ncp;

var files = module.exports = {
	getCurrentDirectoryBase : function() {
		return path.basename(process.cwd());
	},

	directoryExists : function(filePath) {
		try {
			return fs.statSync(filePath).isDirectory();
		} catch (err) {
			return false;
		}
	},

	fileExists : function(filePath) {
		try {
			return fs.existsSync(filePath);
		} catch (err) {
			return false;
		}
	},

	getFileInCurrentContext : function(filePath) {
		return path.resolve(__dirname, filePath);
	},

	createDir : function(name) {
		var dir = "./" + name;
		if (!fs.existsSync(dir)) fs.mkdirSync(dir);
		return dir;
	},

	createFile : function(filePath) {
		return fs.openSync(filePath, 'w');
	},

	appendFile : function(file, text) {
		fs.appendFile(file, text, function(err) {
			if(err) return console.log(err);
		}); 
	},

	removeDir : function(name) {
		var dir = "./" + name;
		if (fs.existsSync(dir)) {
			fs.readdirSync(dir).forEach(function(file, index) {
				var curPath = dir + "/" + file;
				if (fs.lstatSync(curPath).isDirectory()) files.removeDir(curPath);
				else fs.unlinkSync(curPath);
			});
			fs.rmdirSync(dir);
		}
	},

	removeFile : function(name) {
		var pathName = "./" + name;
		if (fs.existsSync(pathName)) fs.unlinkSync(pathName);
	},

	remove : function(name) {
		var pathName = "./" + name;
		if (fs.existsSync(pathName) && fs.lstatSync(pathName).isDirectory()) files.removeDir(pathName);
		else files.removeFile(pathName);
	},

	readFile : function(filePath, callback) {
		if (fs.existsSync(filePath)) fs.readFile(filePath, 'utf8', callback);
	},

	readFileSync : function(filePath) {
		if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8');
	},

	readDir : function(name, callback) {
		var dir = "./" + name;
		if (fs.existsSync(dir)) fs.readdir(dir, callback);
	},

	getAllFiles : function(dir, filelist = {allFiles:[],tsFiles:[],cssFiles:[],jsFiles:[],htmlFiles:[],imgFiles:[]}) {
		fs.readdirSync(dir).forEach(file => {
			if (fs.statSync(path.join(dir, file)).isDirectory()) filelist = files.getAllFiles(path.join(dir, file), filelist);
			else {
				filelist.allFiles = filelist.allFiles.concat(path.join(dir, file));
				if (file.includes('.ts') || file.includes('.tsx')) filelist.tsFiles = filelist.tsFiles.concat(path.join(dir, file));
				if (file.includes('.css')) filelist.cssFiles = filelist.cssFiles.concat(path.join(dir, file));
				if (file.includes('.js')) filelist.jsFiles =  filelist.jsFiles.concat(path.join(dir, file));
				if (file.includes('.html') || file.includes('.xhtml')) filelist.htmlFiles =  filelist.htmlFiles.concat(path.join(dir, file));
				if (file.includes('.jpg') || file.includes('.png') || file.includes('.gif')) filelist.imgFiles =  filelist.imgFiles.concat(path.join(dir, file));
			}			
		});
		return filelist;
	},

	writeFile : function(filePath, message, callback) {
		if (fs.existsSync(filePath)) fs.writeFile(filePath, message, callback);
	},

	createWriteStream : function(filePath) {
		return fs.createWriteStream(filePath);
	},

	copy(oldFile, newFile) {
		return new Promise(function (resolve) {
			if (fs.existsSync(oldFile)) {
				var splitFile = newFile.split('\\');
				splitFile.forEach((string, index) => {
					if (!string.includes('.') && index != 0) files.createDir(newFile.substring(0, newFile.lastIndexOf(string + '\\')) + string);
				});
				ncp(oldFile, newFile, function (err) {
					if (err) return console.error(err);
					resolve();
				});
			} else console.log('Le fichier ' + oldFile + " n'existe pas.")
		});		
	},

	watchFile(filePath, cb) {
		fs.watchFile(filePath, (curr, prev) => cb());	
	}
};
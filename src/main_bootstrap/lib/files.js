const fs = require('fs-extra');
const path = require('path');

var files = module.exports = {
	getCurrentDirectoryBase : () => {
		return path.basename(process.cwd());
	},

	directoryExists : (filePath) => {
		try {
			return fs.statSync(filePath).isDirectory();
		} catch (err) {
			return false;
		}
	},

	fileExists : (filePath) => {
		try {
			return fs.existsSync(filePath);
		} catch (err) {
			return false;
		}
	},

	getFileInCurrentContext : (filePath) => {
		return path.resolve(__dirname, filePath);
	},

	createDir : (name) => {
		var dir = "./" + name;
		if (!fs.existsSync(dir)) fs.mkdirsSync(dir);
		return dir;
	},

	createFile : (filePath) => {
		return fs.openSync(filePath, 'w');
	},

	appendFile : (file, text) => {
		fs.appendFile(file, text, (err) => {
			if(err) return console.log(err);
		}); 
	},

	removeDir : (name) => {
		var dir = "./" + name;
		if (fs.existsSync(dir)) {
			fs.readdirSync(dir).forEach((file, index) => {
				var curPath = dir + "/" + file;
				if (fs.lstatSync(curPath).isDirectory()) files.removeDir(curPath);
				else fs.unlinkSync(curPath);
			});
			fs.rmdirSync(dir);
		}
	},

	removeFile : (name) => {
		var pathName = "./" + name;
		if (fs.existsSync(pathName)) fs.unlinkSync(pathName);
	},

	remove : (name) => {
		var pathName = "./" + name;
		if (fs.existsSync(pathName) && fs.lstatSync(pathName).isDirectory()) files.removeDir(pathName);
		else files.removeFile(pathName);
	},

	readFile : (filePath, callback) => {
		if (fs.existsSync(filePath)) fs.readFile(filePath, 'utf8', callback);
	},

	readFileSync : (filePath) => {
		if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf8');
	},

	readDir : (name, callback) => {
		var dir = "./" + name;
		if (fs.existsSync(dir)) fs.readdir(dir, callback);
	},

	getAllFiles : (dir, excludes, filelist = {allFiles:[],tsCommonFiles:[],tsPageFiles:[],importFiles:[],cssFiles:[],jsFiles:[],htmlFiles:[],imgFiles:[]}) => {
		fs.readdirSync(dir).forEach(file => {
			if (fs.statSync(path.join(dir, file)).isDirectory() && !excludes.includes(file)) filelist = files.getAllFiles(path.join(dir, file), excludes, filelist);
			else {
				if (!excludes.includes(file)) filelist.allFiles = filelist.allFiles.concat(path.join(dir, file));
				if ((file.includes('.ts') || file.includes('.tsx'))) filelist.tsCommonFiles = filelist.tsCommonFiles.concat(path.join(dir, file));
				// if ((file.includes('.ts') || file.includes('.tsx')) && !file.includes('main_core')) filelist.tsCommonFiles = filelist.tsCommonFiles.concat(path.join(dir, file));
				// if ((file.includes('.ts') || file.includes('.tsx')) && file.includes('main_core/ts/pages')) filelist.tsPageFiles = filelist.tsPageFiles.concat(path.join(dir, file));
				if ((file.includes('.ts') || file.includes('.tsx')) && !file.includes('main_core')) filelist.importFiles = filelist.importFiles.concat({'name':file !== "svg.js" ? file.substring(0, file.lastIndexOf('.')) : file,'path':path.join(dir, file)});
				if (file.includes('.css')) filelist.cssFiles = filelist.cssFiles.concat(path.join(dir, file));
				if (file.includes('.js') && !excludes.includes(file)) filelist.jsFiles =  filelist.jsFiles.concat(path.join(dir, file));
				if (file.includes('.html') || file.includes('.xhtml')) filelist.htmlFiles =  filelist.htmlFiles.concat(path.join(dir, file));
				if (file.includes('.jpg') || file.includes('.png') || file.includes('.gif') || file.includes('.svg')) filelist.imgFiles =  filelist.imgFiles.concat(path.join(dir, file));
			}			
		});
		return filelist;
	},

	writeFile : (filePath, message, callback) => {
		if (fs.existsSync(filePath)) fs.writeFile(filePath, message, callback);
	},

	createWriteStream : (filePath) => {
		return fs.createWriteStream(filePath);
	},

	copy : (oldFile, newFile) => {
		return new Promise((resolve) => {
			if (fs.existsSync(oldFile)) {
				fs.copy(oldFile, newFile, (err) => {
					if (err) return console.error(err);
					resolve();
				});
			} else console.log('Le fichier ' + oldFile + " n'existe pas.")
		});		
	},

	watchFile : (filePath, cb) => {
		fs.watchFile(filePath, (curr, prev) => cb());	
	}
};
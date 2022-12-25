const fs = require('fs');
const nbt = require('prismarine-nbt');
const zlib = require('zlib')
const saveDataFolder = "datas";
const worlds = [
	{
		worldName: "Lobby",
		worldFolder: "../serverLobby/world",
		worldFoldersToSave: [
			"playerdata",
			"ftbquests"
		]
	},
	{
		worldName: "Survie",
		worldFolder: "../serverSurvival/world",
		worldFoldersToSave: [
			"playerdata",
			"ftbquests"
		]
	}
]

setInterval(() => {
	saveFromServers(worlds)
	saveToServer(worlds)
	clearSaveFolder()
}, 1000);

// testNbt()
async function testNbt() {
	const buffer = await fs.readFileSync("../serverLobby/world/playerdata/97d4198c-64e3-44e1-8caf-681f670af58d.dat")
	const { parsed, type } = await nbt.parse(buffer)
	parsed.value.Pos.value.value = [0, 50, -10]
	let finalResult = nbt.writeUncompressed(parsed, type)
	let gzip = zlib.gzipSync(finalResult)
	fs.writeFileSync('./test/test/97d4198c-64e3-44e1-8caf-681f670af58d.dat', gzip)
}







// saveToServer(worlds)
async function saveToServer(paramWorlds) { // Vérifie si FolderC est modifié
	for (const world of paramWorlds) {
		for (const folderToSave of world.worldFoldersToSave) {
			const pathServerFilesFolder = world.worldFolder + "/" + folderToSave
			const serverFiles = fs.readdirSync(pathServerFilesFolder)
			for (const serverFile of serverFiles) {
				const pathSavedFilesFolder = saveDataFolder + "/" + folderToSave + "/" + serverFile.split(".")[0]
				const savedFiles = fs.readdirSync(pathSavedFilesFolder)

				for (const savedFile of savedFiles) {
					if (serverFile == savedFile) {
						const pathServerFile = pathServerFilesFolder + "/" + serverFile
						const pathSavedFile = pathSavedFilesFolder + "/" + serverFile
						const timesteampServerFile = fs.statSync(pathServerFile).ctimeMs
						const timesteampSaveFile = fs.statSync(pathSavedFile).ctimeMs
						if (timesteampServerFile + 3000 < timesteampSaveFile) {
							let posAvant = await nbt.parse(fs.readFileSync(pathServerFile))
							posAvant = posAvant.parsed.value.Pos.value.value
							fs.copyFileSync(pathSavedFile, pathServerFile)
							// // NBT CHANGE
							if (serverFile.split(".")[1] == "dat" & folderToSave=="playerdata") {

								const buffer = fs.readFileSync(pathServerFile)
								const { parsed, type } = await nbt.parse(buffer)
								if (world.worldName == "Lobby") {
									parsed.value.Pos.value.value = [0.5, 50, 0.5]
								} else if (world.worldName == "Survie") {
									parsed.value.Pos.value.value = posAvant
								}
								let finalResult = nbt.writeUncompressed(parsed, type)
								let gzip = zlib.gzipSync(finalResult)
								fs.writeFileSync(pathServerFile, gzip)
							}
							// // NBT CHANGE
							
						}
					}
				}
			}
		}
	}
}

function saveToSurvie() { // Vérifie si FolderC est modifié

}


function saveFromServers(paramWorlds) { // Vérifie si FolderA est modifié, si oui on prend, OU si FolderB est modifié, si oui on prend
	fs.mkdirSync(saveDataFolder, { recursive: true })
	for (const world of paramWorlds) {
		for (const folder of world.worldFoldersToSave) {
			const pathSaveDataFolder = saveDataFolder + "/" + folder // Créer dossier dans FolderC
			const pathServerFolder = world.worldFolder + "/" + folder
			const worldFolderFiles = fs.readdirSync(pathServerFolder) // Fichiers des dossiers World des serveurs
			fs.mkdirSync(pathSaveDataFolder, { recursive: true }) // créer un dossier par folderToSave
			for (const worldFolderFile of worldFolderFiles) {
				const pathToServerFile = pathServerFolder + "/" + worldFolderFile
				const pathToSaveFile = pathSaveDataFolder + "/" + worldFolderFile.split(".")[0] + "/" + worldFolderFile
				fs.mkdirSync(pathSaveDataFolder + "/" + worldFolderFile.split(".")[0], { recursive: true }) // créer un dossier par folderToSave

				// Random Error
				try {
					fs.accessSync(pathToSaveFile, fs.constants.F_OK)
				} catch (error) {
					console.log("ERROR");
					fs.copyFileSync(pathToServerFile, pathToSaveFile)
					// fs.writeFileSync(pathToSaveFile, "")
				}
				// -------------

				const timesteampServerFile = fs.statSync(pathToServerFile).ctimeMs
				const timesteampSaveFile = fs.statSync(pathToSaveFile).ctimeMs
				if (timesteampSaveFile < timesteampServerFile) {
					fs.copyFileSync(pathToServerFile, pathToSaveFile + "." + Date.now())
					fs.copyFileSync(pathToServerFile, pathToSaveFile)
				}
			}
		}
	}
}


function clearSaveFolder() {
	const saveDataFolders = fs.readdirSync(saveDataFolder)
	for (const foldersOfSaveDataFolders of saveDataFolders) {
		const folderSaved = fs.readdirSync(saveDataFolder + "/" + foldersOfSaveDataFolders)
		for (const folder of folderSaved) {
			const dir = saveDataFolder + "/" + foldersOfSaveDataFolders + "/" + folder
			fs.readdir(dir, (err, files) => {
				if (err) {
					console.error(err);
					return;
				}

				if (files.length <= 20) {
					// Il y a moins de 20 fichiers, on ne fait rien
					return;
				}

				// On trie les fichiers par date de modification la plus ancienne en premier
				files.sort((a, b) => {
					return fs.statSync(`${dir}/${a}`).mtime.getTime() - fs.statSync(`${dir}/${b}`).mtime.getTime();
				});

				// On supprime le premier fichier (qui est le plus ancien)
				fs.unlink(`${dir}/${files[0]}`, (err) => {
					if (err) {
						console.error(err);
					}
				});
			});
		}
	}
}
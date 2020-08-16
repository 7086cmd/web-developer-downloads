const fs = require('fs')
const qs = require('querystring')
const path = require('path')
const url = require('url')
const os = require('os')
const process = require('process')
const Koa = require('koa')
const extend = require('extend')
const request = require('request')
const cheerio = require('cheerio')
const server = new Koa()
const Electron = require('electron')
const { ipcMain, Menu, app, BrowserWindow, BrowserView } = Electron
const TouchBar = Electron.TouchBar
let platform = os.platform
let arch = os.arch
let gitVersion = ''
app.on('ready', () => {
    let option = {
        width: 1024,
        height: 768,
        movable: true,
        resizable: true,
        frame: true,
        transparent: false,
        maximizable: true,
        minimizable: true,
        webPreferences: {
            nodeIntegration: true
        }
    }
    if(platform == 'win32') {
        option.frame = false
        // option.transparent = true
    }
    let $
    let nodeVersions = '<ol>', gitVersions = '<ol>'
    request('https://npm.taobao.org/mirrors/git-for-windows', (error, response, body) => {
        $ = cheerio.load(body)
        $('a').each((i, e) => {
            let res = $(e).attr('href')
            let result = res.split('/mirrors/git-for-windows/')[1]
            gitVersions += '<li>' + (result != undefined? result.split('/')[0] : '') + '</li>'
        })
        $ = null
        
    })
    gitVersions += '</ol>'
    request('https://npm.taobao.org/mirrors/node', (error, response, body) => {
        let order = 0
        $ = cheerio.load(body)
        $('a').each((i, e) => {
            order ++
            let res = $(e).attr('href')
            let result = res.split('/mirrors/node/')[1]
            nodeVersions += '<li>' + ((result != undefined && String(result).substr(0, 1) == 'v')? String(result).split('/')[0] : '') + '</li>'
        })
        $ = null
        let nodeVer = nodeVersions.split('<li></li>')
        let i
        nodeVersions = '<ol>'
        for(i in nodeVer) {
            nodeVersions += nodeVer[i]
        }
        nodeVersions += '</ol>'
    })
    nodeVersions += '</ol>'
    let mainWindow = new BrowserWindow(option)
    let fileContent = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8')
    server.use(async ctx => {
        ctx.type = 'text/html'
        ctx.body = fileContent
    })
    server.listen(3000)
    // mainWindow.webContents.openDevTools()
    mainWindow.loadURL('http://localhost:3000')
    // let mainWindowBounds, mainWindowWidth, mainWindowHeight, viewHeight, viewWidth
    let mainWindowBounds = mainWindow.getBounds()
    let mainWindowWidth = mainWindowBounds.width
    let mainWindowHeight = mainWindowBounds.height
    let viewWidth = Math.floor(mainWindowWidth)
    let viewHeight = Math.floor(mainWindowWidth - 80)
    console.log('mainWindow: \n', 'width:', mainWindowWidth, '\nheight: ', mainWindowHeight)
    console.log(mainWindowBounds)
    console.log('view: \n', 'width:', viewWidth, '\nheight: ', viewHeight)
    let viewBounds = {
        x: 0,
        y: 80,
        width: parseInt(viewWidth),
        height: parseInt(viewHeight)
    }
    let view = new BrowserView({
        webPreferences: {
            nodeIntegration: true
        }
    })
    view.setBounds(viewBounds)
    // mainWindow.setBrowserView(view)
    // view.webContents.loadURL('http://localhost:3000')
    ipcMain.on('closeMainWindow', () => {
        mainWindow.close()
    })
    ipcMain.on('minMainWindow', () => {
        mainWindow.minimize()
    })
    ipcMain.on('maxMainWindow', () => {
        if(mainWindow.isMaximized()) {
            mainWindow.unmaximize()
        }
        else {
            mainWindow.maximize()
        }
    })
    mainWindow.on('close', () => {
        mainWindow = null
    })
})
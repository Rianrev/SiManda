const { app, Menu } = require('electron')

const isMac = process.platform === 'darwin'

const template = [
    // ( role: 'appMenu' )
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            { role: 'quit' }
        ]
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { type: 'separator'},
            { role: 'togglefullscreen' },
            { type: 'separator' },
            { role: 'toggleDevTools' }
        ]
    },
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' }
        ]
    }
]

module.exports.mainMenu = Menu.buildFromTemplate(template);
const{createLogger, transports, format} = require('winston')

const transactionLog = createLogger({
   transports:[
    new transports.File({ 
            filename: 'transactionXml.log',
            level: 'info',
            format: format.combine(format.timestamp(), format.json())

        }),
        new transports.File({
            filename:'transaction-error.log',
            level:'error',
            format: format.combine(format.timestamp(), format.json())

        })
    ]
})

module.exports={
    transactionLog
}
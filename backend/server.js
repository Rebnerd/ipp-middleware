const express = require('express');
var bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const cors = require('cors')
const ipp = require('../ipp.js')
const mime = require('mime')
const libre = require('libreoffice-convert');
const fs = require('fs');

var extension
var buffer
var Printer = ipp.Printer("http://192.168.66.50:631/printers/412_printer");
const officeFormat = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]
const validExtensions = ['application/pdf',
    'image/jpeg',
    'image/png'].concat(officeFormat)


const app = express();
app.use(bodyParser())
// middleware
app.use(express.static('public')); //to access the files in public folder
app.use(cors()); // it enables all cors requests
// once the file is uploaded,it can be accessed from req.files.*
app.use(fileUpload({
    // 10MB
    limits: {fileSize: 10 * 1024 * 1024},
}));
// file upload api
app.post('/upload', (req, res, next) => {

    if (!req.files) {
        return res.send({msg: "file is not found"})
    }
    extension = mime.getType(req.files.file.name)
    if (validExtensions.indexOf(extension) === -1) {
        return res.send({msg: "非法文件类型！"})
    }
    buffer = req.files.file.data

    if (officeFormat.indexOf(extension) !== -1) {
        // extension = 'application/pdf'
        ConvertDocToPdfPrint()
            .then(modifiedData => {
                var msg = {
                    "operation-attributes-tag": {
                        "last-document": true,
                        "job-id": req.body['job-id'],
                        "requesting-user-name": "normal user",
                        // this is really problematic
                        // "document-format": "application/octet-stream"
                        "document-format": "application/pdf",
                        //iso_a4_210x297mm
                    },
                    data: modifiedData
                };

                Printer.execute("Send-Document", msg, function (err, res_) {
                    res.send(err || res_);
                });
            })
            .catch(err=>{res.send({msg: `${err}服务端错误`})})
    }else{
        var msg = {
            "operation-attributes-tag": {
                "last-document": true,
                "job-id": req.body['job-id'],
                "requesting-user-name": "normal user",
                // this is really problematic
                // "document-format": "application/octet-stream"
                "document-format": extension,
                //iso_a4_210x297mm
            },
            data: buffer
        };

        Printer.execute("Send-Document", msg, function (err, res_) {
            res.send(err || res_);
        });
    }
    // pass all the filter,then go to print stage
})


app.post('/query', (req, res) => {
    Printer.execute("Get-Printer-Attributes", null, function (err, res_) {
        availability = res_["printer-attributes-tag"]["printer-state"] == 'idle' && res_["printer-attributes-tag"]["printer-is-accepting-jobs"]
        queuedJob = res_["printer-attributes-tag"]["queued-job-count"]
        res.send({"status": availability, "wait": queuedJob})
    });
})


app.post('/create-job', (req, res) => {
    console.log('create a print job')
    var create_msg = {
        "operation-attributes-tag": {
            "requesting-user-name": "normal user"
        },
        // fix none A4 document bug
        "job-attributes-tag": {
            "copies": req.body.copies,
            // this is for routing and schedualing only
            // "job-impressions":req.body.number,
            // "job-media-sheets":(req.body.copies)*(req.body.number)
        }
    };
    fs.appendFileSync('./public/dorms.txt',req.body.dorm+'\n',function (err) {
        console.log(err)
    })
    try {
        Printer.execute("Create-Job", create_msg, function (err, res_) {
            // console.log(res_)
            if (!("job-id" in res_['job-attributes-tag'])) {
                return res.status(500).send({msg: "创建任务失败，请重试"})
            }
            let jobId = res_['job-attributes-tag']['job-id'];
            // console.log(jobId)
            res.send({"job-id": jobId})
        });
    } catch (e) {
        res.send(e)
    };

})

function ConvertDocToPdfPrint() {
    return new Promise((resolve,reject)=> {
        libre.convert(buffer, '.pdf', undefined, (err, done) => {
            return err ?
                reject(err) :
                resolve(done)
        });
    })
}


app.listen(4500, () => {
    console.log('server is running at port 4500');
})

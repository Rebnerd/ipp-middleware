var ipp = require('./../ipp');
var PDFDocument = require('pdfkit');
var concat = require("concat-stream");
var doc = new PDFDocument({margin: 0});

doc.text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl. Suspendisse rhoncus nisl posuere tortor tempus et dapibus elit porta. Cras leo neque, elementum a rhoncus ut, vestibulum non nibh. Phasellus pretium justo turpis. Etiam vulputate, odio vitae tincidunt ultricies, eros odio dapibus nisi, ut tincidunt lacus arcu eu elit. Aenean velit erat, vehicula eget lacinia ut, dignissim non tellus. Aliquam nec lacus mi, sed vestibulum nunc. Suspendisse potenti. Curabitur vitae sem turpis. Vestibulum sed neque eget dolor dapibus porttitor at sit amet sem. Fusce a turpis lorem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;',0,0);


doc.pipe(concat(function (data) {
    var printer = ipp.Printer("http://rasberrypi.local:631/printers/ad");
    var msg = {
        "operation-attributes-tag": {
            "requesting-user-name": "owner",
            "job-name": "whatever.pdf",
        }
        , data: data
    };
    printer.execute("Print-Job", msg, function (err, res) {
        console.log(err);
        console.log(res);
    });
}));
doc.end();

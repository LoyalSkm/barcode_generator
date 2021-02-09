var AWS = require("aws-sdk");
var bwipjs = require("bwip-js");
var s3 = new AWS.S3();

const toBuffer = (bcid, text, width, height, scale, barcolor, textcolor) =>
  new Promise((resolve, reject) => {
    bwipjs.loadFont(
      "Inconsolata",
      108,
      // require("fs").readFileSync("/opt/nodejs/fonts/Inconsolata.otf", "binary")
      require("fs").readFileSync("fonts/Inconsolata.otf", "binary")
    );

    var param = {
      bcid: bcid, // Barcode type
      text: text, // Text to encode
      includetext: true, // Show human-readable text
      textxalign: "center", // Always good to set this
      textfont: "Inconsolata", // Use your custom font
      textsize: 13, // Font size, in points
      backgroundcolor: "FFFFFF",
    };

    var optionalParameters = {
      textcolor: textcolor,
      barcolor: barcolor,
      height: height,
      scale: scale,
      width: width,
    };

    for (var key in optionalParameters) {
      if (optionalParameters[key]) {
        param[key] = optionalParameters[key];
      }
    }

    var barcodeid = ["ean13"];

    if (height) {
      param.height = height;
    } else {
      param.height = 25.93;
    }

    if (barcodeid.includes(bcid)) {
      param.paddingtop = 8;
      param.paddingbottom = 8;
      (param.paddingleft = 2), (param.paddingright = 2);
      param.width = 37.29;
    } else {
      (param.paddingtop = 8),
        (param.paddingbottom = 8),
        (param.paddingleft = 8),
        (param.paddingright = 8);
      param.width = param.height;
    }
    console.log(param);
    bwipjs.toBuffer(param, function (err, png) {
      if (err) reject(err);
      else resolve(png);
    });
  });

const upload = async (image, name, project, bcid) => {
  var errItemsList = [
    "!",
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "_",
    "-",
    "+",
    "|",
    "/",
  ];
  for (var i in errItemsList) {
    if (name.indexOf(errItemsList[i]) > -1) {
      return {
        error: "barcode cannot contain characters " + errItemsList[i],
      };
    }
  }

  if (project) {
    var road = project + "/" + bcid + "_" + name + ".png";
  } else {
    road = name + ".png";
  }

  const params = {
    Bucket: "testbarcodebacket",
    Key: road,
    Body: image,
    ACL: "public-read",
    ContentEncoding: "base64",
    ContentType: "image/png",
  };

  return await new Promise((resolve, reject) => {
    s3.putObject(params, (err, results) => {
      if (err) reject(err);
      else
        resolve({
          url:
            "https://testbarcodebacket.s3.eu-central-1.amazonaws.com/" + road,
          results,
        });
    });
  });
};

const main = async (event) => {
  try {
    var png = await toBuffer(
      event.bcid,
      event.text,
      event.width,
      event.height,
      event.scale,
      event.barcolor, //format "808000"
      event.textcolor,
      event.projectId
    );
  } catch (error) {
    return { error: error.message };
  }
  try {
    var response = await upload(png, event.text, event.projectId, event.bcid);
  } catch (error) {
    return { error: error.message };
  }
  return response;
};

exports.handler = main;
//qr-bar-code.s3.eu-central-1

var AWS = require("aws-sdk");
var bwipjs = require("bwip-js");

var ID = "AKIAIHJNITK2DKJ7PP7A";
var SECRET = "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";
var s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});

const toBuffer = (bcid, text) =>
  new Promise((resolve, reject) => {
    bwipjs.loadFont(
      "Inconsolata",
      108,
      require("fs").readFileSync("fonts/Inconsolata.otf", "binary")
    );
    bwipjs.toBuffer(
      {
        bcid: bcid, // Barcode type
        text: text, // Text to encode
        // scale: 5,
        includetext: true, // Show human-readable text
        textxalign: "center", // Always good to set this
        textfont: "Inconsolata", // Use your custom font
        textsize: 13, // Font size, in points
        backgroundcolor: "FFFFFF",
      },
      function (err, png) {
        if (err) reject(err);
        else resolve(png), console.log(png);
      }
    );
  });

const upload = async (image, name) => {
  const params = {
    Bucket: "barcodebucket",
    Key: name + ".png",
    Body: image,
    ACL: "public-read",
    // ContentEncoding: "base64",
    ContentType: "image/png",
  };
  return await new Promise((resolve, reject) => {
    s3.putObject(params, (err, results) => {
      if (err) reject(err);
      else
        resolve({
          url:
            "https://barcodebucket.s3.us-east-2.amazonaws.com/" + name + ".png",
        });
    });
  });
};

const main = async (event) => {
  // console.time("FirstWay");
  try {
    var png = await toBuffer(event.bcid, event.text);
  } catch (error) {
    return { error: "can't create bar code" };
  }
  try {
    var response = await upload(png, event.text);
  } catch (error) {
    return { error: "can't upload image to S3 bucket" };
  }
  // console.timeEnd("FirstWay");
  return response;
};

exports.handler = main;

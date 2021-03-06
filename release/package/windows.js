const $ = require("../common");
const { join } = require("path").posix;

module.exports = {
  sign: async function(arch, buildPath) {
    let exeName = `${$.appName()}.exe`;
    let exePath = join(buildPath, exeName);
    // see package function
    // forward-slashes are doubled because of mingw, see http://www.mingw.org/wiki/Posix_path_conversion
    let signParams =
      '//v //s MY //n "itch corp." //fd sha256 //tr http://timestamp.comodoca.com/?td=sha256 //td sha256';
    let signtoolPath = "vendor/signtool.exe";
    $(await $.sh(`${signtoolPath} sign ${signParams} ${exePath}`));
  },
};

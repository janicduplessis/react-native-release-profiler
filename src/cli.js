"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}

async function profileHermes([dstPath], ctx, options) {
  try {
    _cliTools().logger.info('Downloading a Hermes Sampling Profiler from your Android device...');
    if (!options.filename) {
      _cliTools().logger.info('No filename is provided, pulling latest file');
    }
    await downloadProfile(ctx, options.local, options.fromDownload, dstPath, options.filename, options.sourcemapPath, options.raw, options.generateSourcemap, options.port, options.appId, options.appIdSuffix);
  } catch (err) {
    throw err;
  }
}
/*var _default = {
  name: 'profile-hermes [destinationDir]',
  description: 'Pull and convert a Hermes tracing profile to Chrome tracing profile, then store it in the directory <destinationDir> of the local machine',
  func: profileHermes,
  options: [{
    name: '--filename <string>',
    description: 'File name of the profile to be downloaded, eg. sampling-profiler-trace8593107139682635366.cpuprofile'
  }, {
    name: '--raw',
    description: 'Pulls the original Hermes tracing profile without any transformation'
  }, {
    name: '--sourcemap-path <string>',
    description: 'The local path to your source map file, eg. /tmp/sourcemap.json'
  }, {
    name: '--generate-sourcemap',
    description: 'Generates the JS bundle and source map'
  }, {
    name: '--port <number>',
    default: `${process.env.RCT_METRO_PORT || 8081}`
  }, {
    name: '--appId <string>',
    description: 'Specify an applicationId to launch after build. If not specified, `package` from AndroidManifest.xml will be used.'
  }, {
    name: '--appIdSuffix <string>',
    description: 'Specify an applicationIdSuffix to launch after build.'
  }, {
    name: '--fromDownload',
    description: 'Specify if script should find profile in downloads directory on the phone'
  }, {
    name: '--local <string>',
    description: 'Local path to hermes profile you want to transform.'
  }],
  examples: [{
    desc: 'Download the Hermes Sampling Profiler to the directory <destinationDir> on the local machine',
    cmd: 'profile-hermes /tmp'
  }]
};
exports.default = _default;*/

//# sourceMappingURL=index.ts.map

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.downloadProfile = downloadProfile;
function _child_process() {
  const data = require("child_process");
  _child_process = function () {
    return data;
  };
  return data;
}
function _cliTools() {
  const data = require("@react-native-community/cli-tools");
  _cliTools = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = _interopRequireDefault(require("fs"));
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
    return data;
  };
  return data;
}
function _os() {
  const data = _interopRequireDefault(require("os"));
  _os = function () {
    return data;
  };
  return data;
}
function _hermesProfileTransformer() {
  const data = _interopRequireDefault(require("hermes-profile-transformer"));
  _hermesProfileTransformer = function () {
    return data;
  };
  return data;
}
var _sourcemapUtils = require("@react-native-community/cli-hermes/build/profileHermes/sourcemapUtils");
function _cliPlatformAndroid() {
  const data = require("@react-native-community/cli-platform-android");
  _cliPlatformAndroid = function () {
    return data;
  };
  return data;
}
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Get the last modified hermes profile
 * @param packageNameWithSuffix
 */
function getLatestFile(packageNameWithSuffix) {
  try {
    const file = (0, _child_process().execSync)(`adb shell run-as ${packageNameWithSuffix} ls cache/ -tp | grep -v /$ | grep -E '.cpuprofile' | head -1
        `);
    return file.toString().trim();
  } catch (e) {
    throw e;
  }
}

function getLatestFileFromDownloads() {
    try {
      const file = (0, _child_process().execSync)(`adb shell ls "/sdcard/Download" -tp | grep -v /$ | grep -E '.cpuprofile' | head -1
          `);
      return file.toString().trim();
    } catch (e) {
      throw e;
    }
  }

function execSyncWithLog(command) {
  _cliTools().logger.debug(`${command}`);
  return (0, _child_process().execSync)(command);
}

async function downloadProfile(ctx, local, fromDownload, dstPath, filename, sourcemapPath, raw, shouldGenerateSourcemap, port, appId, appIdSuffix) {
    
    try {
      const androidProject = (0, _cliPlatformAndroid().getAndroidProject)(ctx);
      const packageNameWithSuffix = [appId || androidProject.packageName, appIdSuffix].filter(Boolean).join('.');
  
      // If file name is not specified, pull the latest file from device
      const file = filename || ((fromDownload) ? getLatestFileFromDownloads(packageNameWithSuffix) : getLatestFile(packageNameWithSuffix));
      if (!file) {
        throw new (_cliTools().CLIError)('There is no file in the cache/ directory. Did you record a profile from the developer menu?');
      }
      _cliTools().logger.info(`File to be pulled: ${file}`);
  
      // If destination path is not specified, pull to the current directory
      dstPath = dstPath || ctx.root;
      _cliTools().logger.debug('Internal commands run to pull the file:');
  
      // If --raw, pull the hermes profile to dstPath
      if (raw) {
        execSyncWithLog(`adb shell run-as ${packageNameWithSuffix} cat cache/${file} > ${dstPath}/${file}`);
        _cliTools().logger.success(`Successfully pulled the file to ${dstPath}/${file}`);
      }
  
      // Else: transform the profile to Chrome format and pull it to dstPath
      else {
        const osTmpDir = _os().default.tmpdir();
        const tempFilePath = _path().default.join(osTmpDir, file);
        if (local) {
            _fs().default.copyFileSync(local, tempFilePath)
        } else if (fromDownload) {
            execSyncWithLog(`adb shell cat /sdcard/Download/${file} > ${tempFilePath}`);
        } else {
            execSyncWithLog(`adb shell run-as ${packageNameWithSuffix} cat cache/${file} > ${tempFilePath}`);
        }
        
        // If path to source map is not given
        if (!sourcemapPath) {
          // Get or generate the source map
          if (shouldGenerateSourcemap) {
            sourcemapPath = await (0, _sourcemapUtils.generateSourcemap)(port);
          } else {
            sourcemapPath = await (0, _sourcemapUtils.findSourcemap)(ctx, port);
          }
  
          // Run without source map
          if (!sourcemapPath) {
            _cliTools().logger.warn('Cannot find source maps, running the transformer without it');
            _cliTools().logger.info('Instructions on how to get source maps: set `bundleInDebug: true` in your app/build.gradle file, inside the `project.ext.react` map.');
          }
        }
  
        // Run transformer tool to convert from Hermes to Chrome format
        const events = await (0, _hermesProfileTransformer().default)(tempFilePath, sourcemapPath, 'index.bundle');
        const transformedFilePath = `${dstPath}/${_path().default.basename(file, '.cpuprofile')}-converted.json`;
        _fs().default.writeFileSync(transformedFilePath, JSON.stringify(events, undefined, 4), 'utf-8');
        _cliTools().logger.success(`Successfully converted to Chrome tracing format and pulled the file to ${transformedFilePath}`);
      }
    } catch (e) {
      throw e;
    }
}

const { program } = require('commander');

program
  .option('--filename <string>')
  .option('--sourcemap-path <string>')
  .option('--generate-sourcemap')
  .option('--port <number>')
  .option('--appId <string>')
  .option('--appIdSuffix <string>')
  .option('--fromDownload')
  .option('--local <string>');
 
program.parse();

console.log(__dirname)

const options = program.opts();
const dstPath = "./"
const ctx = require('@react-native-community/cli-config').default;
downloadProfile(ctx, options.local, options.fromDownload, dstPath, options.filename, options.sourcemapPath, options.raw, options.generateSourcemap, options.port, options.appId, options.appIdSuffix);

from pathlib import Path
import plistlib, shutil, subprocess

source = Path(__file__).resolve().parent
project = source.parent
outputs = project / "dist"
version = __import__("json").loads((project / "extension/manifest.json").read_text())["version"]
app = outputs / 'Spoiler Shield.app'
extension = app / 'Contents/PlugIns/Spoiler Shield Extension.appex'
for bundle in [app, extension]:
    (bundle/'Contents/MacOS').mkdir(parents=True, exist_ok=True)
    (bundle/'Contents/Resources').mkdir(exist_ok=True)
common = dict(CFBundleDevelopmentRegion='ru', CFBundleInfoDictionaryVersion='6.0',
    CFBundleShortVersionString=version, CFBundleVersion='4', LSMinimumSystemVersion='12.0',
    CFBundleSupportedPlatforms=['MacOSX'])
app_info = dict(common, CFBundleIdentifier='local.spoilershield.mac', CFBundleName='Spoiler Shield',
    CFBundleDisplayName='Spoiler Shield', CFBundleExecutable='SpoilerShield',
    CFBundlePackageType='APPL', NSPrincipalClass='NSApplication', NSHighResolutionCapable=True)
ext_info = dict(common, CFBundleIdentifier='local.spoilershield.mac.extension',
    CFBundleName='Spoiler Shield Extension', CFBundleDisplayName='Spoiler Shield',
    CFBundleExecutable='SpoilerShieldExtension', CFBundlePackageType='XPC!',
    NSExtension=dict(NSExtensionPointIdentifier='com.apple.Safari.web-extension',
        NSExtensionPrincipalClass='ShieldWebExtensionHandler'))
for bundle, info in [(app,app_info),(extension,ext_info)]:
    (bundle/'Contents/Info.plist').write_bytes(plistlib.dumps(info))
for item in (project/'extension').iterdir():
    if item.suffix in ['.js','.css','.html','.json']:
        shutil.copy2(item, extension/'Contents/Resources'/item.name)
entitlements = source/'entitlements.plist'
entitlements.write_bytes(plistlib.dumps({'com.apple.security.app-sandbox': True}))
for src, dst, frameworks in [
    ('App.m',app/'Contents/MacOS/SpoilerShield',['Cocoa','SafariServices']),
    ('Extension.m',extension/'Contents/MacOS/SpoilerShieldExtension',['Foundation'])]:
    command = ['xcrun','clang','-fobjc-arc','-O2','-arch','arm64','-arch','x86_64','-mmacosx-version-min=12.0',str(source/src),'-o',str(dst)]
    for framework in frameworks: command += ['-framework',framework]
    subprocess.run(command, check=True)
for bundle in [extension,app]:
    subprocess.run(['codesign','--force','--sign','-','--entitlements',str(entitlements),str(bundle)],check=True)
subprocess.run(['codesign','--verify','--deep','--strict','--verbose=2',str(app)],check=True)
print(app)

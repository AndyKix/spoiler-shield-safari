#import <Cocoa/Cocoa.h>
#import <SafariServices/SafariServices.h>
@interface ShieldDelegate : NSObject <NSApplicationDelegate>
@property(strong) NSWindow *window;
@end
@implementation ShieldDelegate
- (void)applicationDidFinishLaunching:(NSNotification *)notification {
    self.window = [[NSWindow alloc] initWithContentRect:NSMakeRect(0,0,460,230)
        styleMask:NSWindowStyleMaskTitled|NSWindowStyleMaskClosable
        backing:NSBackingStoreBuffered defer:NO];
    self.window.title = @"Spoiler Shield";
    NSTextField *label = [NSTextField wrappingLabelWithString:@"Spoiler Shield для YouTube\n\nВключите расширение в Safari и разрешите доступ к YouTube. Список слов доступен по кнопке расширения. Обработка происходит локально."];
    label.frame = NSMakeRect(24,85,412,120);
    [self.window.contentView addSubview:label];
    NSButton *button = [NSButton buttonWithTitle:@"Открыть настройки Safari" target:self action:@selector(showSettings:)];
    button.frame = NSMakeRect(100,25,260,36);
    [self.window.contentView addSubview:button];
    [self.window center]; [self.window makeKeyAndOrderFront:nil];
    [NSApp activateIgnoringOtherApps:YES];
}
- (void)showSettings:(id)sender {
    [SFSafariApplication showPreferencesForExtensionWithIdentifier:@"local.spoilershield.mac.extension" completionHandler:^(NSError *error) {
        if (error) NSLog(@"Safari settings: %@", error.localizedDescription);
    }];
}
- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender { return YES; }
@end
int main(int argc, const char *argv[]) {
    @autoreleasepool {
        NSApplication *app = NSApplication.sharedApplication;
        ShieldDelegate *delegate = [ShieldDelegate new];
        app.delegate = delegate;
        [app setActivationPolicy:NSApplicationActivationPolicyRegular];
        [app run];
    }
    return 0;
}

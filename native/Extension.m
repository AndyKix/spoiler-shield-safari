#import <Foundation/Foundation.h>
@interface ShieldWebExtensionHandler : NSObject <NSExtensionRequestHandling>
@end
@implementation ShieldWebExtensionHandler
- (void)beginRequestWithExtensionContext:(NSExtensionContext *)context {
    [context completeRequestReturningItems:@[] completionHandler:nil];
}
@end
extern int NSExtensionMain(int argc, const char *argv[]);
int main(int argc, const char *argv[]) { return NSExtensionMain(argc, argv); }

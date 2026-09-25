// swift-tools-version: 5.9
import PackageDescription
let package = Package(
    name: "NomadNativeAuth",
    platforms: [.iOS(.v16)],
    products: [.library(name: "NomadNativeAuth", targets: ["NomadNativeAuth"])],
    dependencies: [.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.2")],
    targets: [.target(name: "NomadNativeAuth", dependencies: [
        .product(name: "Capacitor", package: "capacitor-swift-pm"),
        .product(name: "Cordova", package: "capacitor-swift-pm")
    ], path: "ios/Sources/NomadNativeAuth")]
)

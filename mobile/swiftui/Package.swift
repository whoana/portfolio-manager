// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ETFPortfolioManager",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    targets: [
        .target(
            name: "ETFPortfolioManager",
            path: "ETFPortfolioManager"
        ),
        .testTarget(
            name: "ETFPortfolioManagerTests",
            dependencies: ["ETFPortfolioManager"],
            path: "Tests"
        ),
    ]
)

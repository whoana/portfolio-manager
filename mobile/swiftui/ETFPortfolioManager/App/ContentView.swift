import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(ThemeManager.self) private var theme
    @AppStorage("hasSeenIntro") private var hasSeenIntro = false
    @State private var selectedTab = 0
    @State private var portfolioVM: PortfolioViewModel?
    @State private var holdingsVM: HoldingsViewModel?
    @State private var showDataMenu = false

    var body: some View {
        Group {
            if !hasSeenIntro {
                IntroView {
                    withAnimation { hasSeenIntro = true }
                }
            } else if let vm = portfolioVM {
                NavigationStack {
                    VStack(spacing: 0) {
                        // 공통 히어로 헤더 + 포트폴리오 선택기 (모든 탭에 표시)
                        SharedPortfolioHeader(viewModel: vm)
                            .padding(.top, 8)
                            .padding(.bottom, 4)

                        TabView(selection: $selectedTab) {
                            StocksTab(viewModel: vm)
                                .tabItem {
                                    Image(systemName: selectedTab == 0 ? "square.grid.2x2.fill" : "square.grid.2x2")
                                    Text("종목")
                                }
                                .tag(0)

                            AllocationTab(viewModel: vm)
                                .tabItem {
                                    Image(systemName: selectedTab == 1 ? "dollarsign.circle.fill" : "dollarsign.circle")
                                    Text("배분")
                                }
                                .tag(1)

                            SummaryTab(viewModel: vm)
                                .tabItem {
                                    Image(systemName: selectedTab == 2 ? "chart.bar.fill" : "chart.bar")
                                    Text("요약")
                                }
                                .tag(2)

                            GrowthTab(viewModel: vm)
                                .tabItem {
                                    Image(systemName: selectedTab == 3 ? "chart.line.uptrend.xyaxis.circle.fill" : "chart.line.uptrend.xyaxis.circle")
                                    Text("성장")
                                }
                                .tag(3)

                            HoldingsTab(
                                portfolioVM: vm,
                                holdingsVM: holdingsVM ?? HoldingsViewModel(modelContext: modelContext)
                            )
                                .tabItem {
                                    Image(systemName: selectedTab == 4 ? "checkmark.shield.fill" : "checkmark.shield")
                                    Text("보유")
                                }
                                .tag(4)
                        }
                        .tint(theme.accentColor)
                    }
                    #if os(iOS)
                    .navigationBarTitleDisplayMode(.inline)
                    #endif
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button {
                                withAnimation { hasSeenIntro = false }
                            } label: {
                                Text("포트폴리오 매니저")
                                    .font(.system(size: 17, weight: .bold))
                                    .foregroundColor(theme.textPrimary)
                                    .fixedSize()
                            }
                        }
                        ToolbarItem(placement: .topBarTrailing) {
                            Button {
                                showDataMenu = true
                            } label: {
                                Image(systemName: "square.grid.3x3.fill")
                                    .font(.body)
                                    .foregroundColor(theme.accentColor)
                            }
                        }
                    }
                    .sheet(isPresented: $showDataMenu) {
                        DataMenuSheet(
                            portfolioVM: vm,
                            holdingsVM: holdingsVM ?? HoldingsViewModel(modelContext: modelContext)
                        )
                    }
                }
            } else {
                ProgressView("로딩 중...")
            }
        }
        .onAppear {
            if portfolioVM == nil {
                DemoDataSeeder.seedIfNeeded(context: modelContext)
                portfolioVM = PortfolioViewModel(modelContext: modelContext)
                holdingsVM = HoldingsViewModel(modelContext: modelContext)
            }
        }
    }
}

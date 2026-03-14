import SwiftUI

struct IntroCardData: Identifiable {
    let id: Int
    let emoji: String
    let tag: String
    let line1: String
    let line2: String
    let highlight: String
    let accent: Color
    let bgGradient: [Color]
}

private func makeIntroCards() -> [IntroCardData] {
    [
        IntroCardData(
            id: 1, emoji: "🎯", tag: "WELCOME",
            line1: "투자가 필요한 시점이라고", line2: "맘먹은 거야?",
            highlight: "그래, 그럼 잘 찾아왔어.",
            accent: Color(hex: "#c084fc"),
            bgGradient: [Color(hex: "#0a0015"), Color(hex: "#1a0033"), Color(hex: "#2d004d")]
        ),
        IntroCardData(
            id: 2, emoji: "🎰", tag: "WARNING",
            line1: "요즘 장이 잘 간다고", line2: "있는 돈 다 때려부을 려고?",
            highlight: "한탕주의는 금물이야.",
            accent: Color(hex: "#fb7185"),
            bgGradient: [Color(hex: "#1a0005"), Color(hex: "#2d000d"), Color(hex: "#45001a")]
        ),
        IntroCardData(
            id: 3, emoji: "🐢", tag: "SLOW & STEADY",
            line1: "토끼가 낮잠 잘 때", line2: "거북이는 걸었어.",
            highlight: "장기투자는 걷기야, 달리기가 아니라.",
            accent: Color(hex: "#34d399"),
            bgGradient: [Color(hex: "#001a0a"), Color(hex: "#00331a"), Color(hex: "#004d2d")]
        ),
        IntroCardData(
            id: 4, emoji: "🧺", tag: "DIVERSIFY",
            line1: "엄마가 뭐라고 했어?", line2: "계란 한 바구니에 담지 말래잖아.",
            highlight: "분산투자, 엄마 말이 맞아.",
            accent: Color(hex: "#60a5fa"),
            bgGradient: [Color(hex: "#0a0a1a"), Color(hex: "#0d1a33"), Color(hex: "#102a4d")]
        ),
        IntroCardData(
            id: 5, emoji: "🚀", tag: "LET'S GO",
            line1: "여기까지 읽었으면", line2: "마음의 준비는 된 거야.",
            highlight: "천천히, 꾸준히. 같이 가보자.",
            accent: Color(hex: "#fbbf24"),
            bgGradient: [Color(hex: "#1a1200"), Color(hex: "#332400"), Color(hex: "#4d3600")]
        ),
    ]
}

private let compoundData: [(year: Int, amount: String, growth: String)] = [
    (10, "1억 2,969만원", "+159%"),
    (20, "3억 3,637만원", "+573%"),
    (30, "8억 7,247만원", "+1,645%"),
]

struct IntroView: View {
    let onStart: () -> Void

    @State private var currentIndex = 0
    @State private var highlightVisible = false
    @State private var timer: Timer?
    private let introCards = makeIntroCards()

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // 카드 캐러셀
                cardSection
                    .padding(.top, 20)

                // 복리 시뮬레이션
                compoundSection
                    .padding(.top, 24)
                    .padding(.horizontal, 20)

                // CTA 버튼
                ctaSection
                    .padding(.top, 24)
                    .padding(.bottom, 40)
            }
        }
        .background(Color(hex: "#050508"))
        .onAppear { startAutoAdvance() }
        .onDisappear { timer?.invalidate() }
    }

    // MARK: - Card Section

    private var cardSection: some View {
        let card = introCards[currentIndex]

        return VStack(spacing: 20) {
            // Progress dots
            HStack(spacing: 8) {
                ForEach(introCards) { c in
                    Capsule()
                        .fill(
                            c.id == card.id
                            ? LinearGradient(colors: [card.accent, card.accent.opacity(0.6)], startPoint: .leading, endPoint: .trailing)
                            : LinearGradient(colors: [Color.white.opacity(0.08)], startPoint: .leading, endPoint: .trailing)
                        )
                        .frame(width: c.id == card.id ? 40 : 6, height: 6)
                        .animation(.spring(duration: 0.5), value: currentIndex)
                }
            }

            // Card
            ZStack {
                RoundedRectangle(cornerRadius: 32)
                    .fill(LinearGradient(colors: card.bgGradient, startPoint: .topLeading, endPoint: .bottomTrailing))
                    .shadow(color: card.accent.opacity(0.12), radius: 40, y: 8)

                // Top accent line
                VStack {
                    RoundedRectangle(cornerRadius: 1)
                        .fill(LinearGradient(colors: [.clear, card.accent.opacity(0.4), .clear], startPoint: .leading, endPoint: .trailing))
                        .frame(height: 2)
                        .padding(.horizontal, 60)
                    Spacer()
                }

                VStack(alignment: .leading, spacing: 0) {
                    // Tag pill
                    HStack(spacing: 8) {
                        Text(card.emoji)
                            .font(.system(size: 20))
                        Text(card.tag)
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .tracking(2.5)
                            .foregroundColor(card.accent)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 6)
                    .background(card.accent.opacity(0.07))
                    .overlay(
                        Capsule().stroke(card.accent.opacity(0.15), lineWidth: 1)
                    )
                    .clipShape(Capsule())

                    Spacer()

                    // Lines
                    VStack(alignment: .leading, spacing: 0) {
                        Text(card.line1)
                            .font(.system(size: 22, weight: .regular))
                            .foregroundColor(.white.opacity(0.65))
                        Text(card.line2)
                            .font(.system(size: 22, weight: .regular))
                            .foregroundColor(.white.opacity(0.65))
                    }
                    .lineSpacing(10)

                    // Highlight
                    VStack(alignment: .leading, spacing: 14) {
                        Text(card.highlight)
                            .font(.system(size: 24, weight: .black))
                            .foregroundColor(.white)
                            .opacity(highlightVisible ? 1 : 0)
                            .offset(y: highlightVisible ? 0 : 20)
                            .animation(.spring(duration: 0.7), value: highlightVisible)

                        RoundedRectangle(cornerRadius: 2)
                            .fill(LinearGradient(colors: [card.accent, .clear], startPoint: .leading, endPoint: .trailing))
                            .frame(width: highlightVisible ? 160 : 0, height: 3)
                            .shadow(color: card.accent.opacity(0.3), radius: 8)
                            .animation(.spring(duration: 0.8).delay(0.3), value: highlightVisible)
                    }
                    .padding(.top, 28)

                    Spacer()
                }
                .padding(32)

                // Ghost number
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Text(String(format: "%02d", currentIndex + 1))
                            .font(.system(size: 64, weight: .bold, design: .monospaced))
                            .foregroundColor(card.accent.opacity(0.05))
                    }
                }
                .padding(28)
            }
            .frame(height: 420)
            .padding(.horizontal, 20)
            .gesture(
                DragGesture(minimumDistance: 30)
                    .onEnded { value in
                        if value.translation.width < -30 { navigate(1) }
                        else if value.translation.width > 30 { navigate(-1) }
                    }
            )

            // Navigation buttons
            HStack(spacing: 16) {
                navButton(icon: "chevron.left", accent: card.accent, filled: false) {
                    navigate(-1)
                }
                navButton(icon: "chevron.right", accent: card.accent, filled: true) {
                    navigate(1)
                }
            }
        }
    }

    // MARK: - Compound Section

    private var compoundSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("복리 시뮬레이션")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(.white)
            Text("5,000만원을 연 10%(배당 재투자) 복리로 투자했을 때")
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.5))

            HStack(spacing: 12) {
                ForEach(compoundData, id: \.year) { d in
                    VStack(spacing: 6) {
                        Text("\(d.year)년 후")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.white.opacity(0.5))
                        Text(d.amount)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                        Text(d.growth)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(Color(hex: "#60a5fa"))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(16)
                }
            }
        }
        .padding(20)
        .background(Color.white.opacity(0.03))
        .cornerRadius(20)
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(Color.white.opacity(0.06), lineWidth: 1)
        )
    }

    // MARK: - CTA Section

    private var ctaSection: some View {
        VStack(spacing: 12) {
            Button(action: onStart) {
                Text("포트폴리오 시작하기")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "#3b82f6"), Color(hex: "#2563eb")],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .cornerRadius(16)
            }
            .padding(.horizontal, 20)

            Text("ETF 포트폴리오를 구성하고 장기 성장을 시뮬레이션하세요")
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.4))
        }
    }

    // MARK: - Helpers

    private func navButton(icon: String, accent: Color, filled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .light))
                .frame(width: 44, height: 44)
                .foregroundColor(filled ? .white : accent)
                .background(filled ? accent : accent.opacity(0.08))
                .cornerRadius(14)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(accent.opacity(filled ? 0 : 0.3), lineWidth: 1.5)
                )
        }
    }

    private func navigate(_ direction: Int) {
        timer?.invalidate()
        withAnimation(.spring(duration: 0.45)) {
            highlightVisible = false
            var next = currentIndex + direction
            if next >= introCards.count { next = 0 }
            if next < 0 { next = introCards.count - 1 }
            currentIndex = next
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            withAnimation { highlightVisible = true }
        }
        startAutoAdvance()
    }

    private func startAutoAdvance() {
        timer?.invalidate()
        highlightVisible = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            withAnimation { highlightVisible = true }
        }
        timer = Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { _ in
            navigate(1)
        }
    }
}


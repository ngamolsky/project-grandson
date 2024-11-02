import SwiftUI

struct ContentView: View {
    @StateObject private var pythonBridge = PythonBridge()
    @State private var question: String = ""
    @State private var response: String = ""
    @State private var isLoading = false
    
    var body: some View {
        VStack(spacing: 24) {
            Text("Claude Desktop Vision")
                .font(.system(size: 36, weight: .bold))
                .padding(.top, 12)
            
            if pythonBridge.isRunning {
                VStack(spacing: 16) {
                    TextField("Ask a question about your screen...", text: $question)
                        .textFieldStyle(.roundedBorder)
                        .padding(.horizontal)
                        .font(.system(size: 16))
                    
                    Button(action: askQuestion) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .padding(.trailing, 8)
                            }
                            Text(isLoading ? "Processing..." : "Ask Claude")
                                .font(.headline)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue.gradient)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .shadow(radius: 2)
                    }
                    .disabled(isLoading || question.isEmpty)
                    .padding(.horizontal)
                    
                    ScrollView {
                        Text(response)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                    }
                    .padding(.horizontal)
                }
            } else {
                Button(action: startService) {
                    Text("Start Vision Service")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green.gradient)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .shadow(radius: 2)
                }
                .padding(.horizontal)
            }
            
            Spacer()
        }
        .padding()
        .frame(minWidth: 500, minHeight: 400)
    }
    
    private func startService() {
        pythonBridge.startVisionClaude()
    }
    
    private func askQuestion() {
        isLoading = true
        Task {
            do {
                let result = try await pythonBridge.askQuestion(question)
                await MainActor.run {
                    response = result
                    isLoading = false
                }
            } catch {
                await MainActor.run {
                    response = "Error: \(error.localizedDescription)"
                    isLoading = false
                }
            }
        }
    }
}

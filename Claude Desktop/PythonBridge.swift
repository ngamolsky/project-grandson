//
//  PythonBridge.swift
//  Claude Desktop
//
//  Created by Nikita Gamolsky on 11/1/24.
//


import Foundation
import PythonKit

class PythonBridge: ObservableObject {
    private var visionClaude: PythonObject?
    @Published var isRunning = false
    @Published var lastResponse: String = ""
    
    init() {
        setupPythonEnvironment()
    }
    
    private func setupPythonEnvironment() {
        // Point to your Python library
        let pythonPath = "/opt/homebrew/opt/python@3.12/Frameworks/Python.framework/Versions/3.12/lib/libpython3.12.dylib"
        setenv("PYTHON_LIBRARY", pythonPath, 1)
        setenv("PYTHON_LOADER_LOGGING", "1", 1)
        
        // Initialize Python
        PythonLibrary.useVersion(3)
        
        let sys = Python.import("sys")
        let projectPath = "/Users/nikitagamolsky/Projects/Claude Desktop/Python"
        sys.path.append(projectPath)
        
        // Add the virtual environment site-packages
        let sitePackagesPath = "\(projectPath)/.venv/lib/python3.12/site-packages"
        sys.path.append(sitePackagesPath)
    }
    
    func startVisionClaude() {
        let visionClaudeModule = Python.import("vision_claude")
        visionClaude = visionClaudeModule.VisionClaude()
        isRunning = true
        
    }
    
    func askQuestion(_ question: String) async throws -> String {
        guard let visionClaude = visionClaude else {
            throw NSError(domain: "PythonBridge", code: 1, userInfo: [NSLocalizedDescriptionKey: "Vision Claude not initialized"])
        }
        
        let screenshots = visionClaude.get_recent_screenshots()
        if Python.len(screenshots) > 0 {
            let firstScreenshot = screenshots[0]
            let path = firstScreenshot["path"]
            let response = try visionClaude.analyze_image(path, question)
            lastResponse = String(response) ?? "Error converting response"
            return lastResponse
        }
        
        return "No screenshots available"
    }
}

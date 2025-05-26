import React, { useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { UserContext } from '../Context/User.context';
import axios from '../config/Axios';
import { initializeSocket, receiveMessage, sendMessage, disconnectSocket } from '../config/Socket';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import { getWebContainer } from '../config/webContainer';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Environment detection
const isLocalDevelopment = process.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

const isWebContainerSupported = () => {
  return isLocalDevelopment && 
         typeof window !== 'undefined' && 
         window.WebContainer && 
         window.location.protocol === 'https:' || window.location.hostname === 'localhost';
};

function SyntaxHighlightedCode({ className, children }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && className?.includes('lang-')) {
            hljs.highlightElement(ref.current);
        }
    }, [className, children]);

    return <code ref={ref} className={className}>{children}</code>;
}

const Project = () => {
    const { user } = useContext(UserContext);
    const location = useLocation();
    const [project, setProject] = useState({});
    const [projectFiles, setProjectFiles] = useState([]);
    const [currentFile, setCurrentFile] = useState(null);
    const [files, setFiles] = useState({});
    const [webContainer, setWebContainer] = useState(null);
    const [iframeUrl, setIframeUrl] = useState('');
    const [installed, setInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isWebContainerInitializing, setIsWebContainerInitializing] = useState(false);
    
    // Chat states
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const projectId = location.pathname.split('/')[2];

    const initializeWebContainer = async () => {
        if (!isWebContainerSupported()) {
            setErrorMessage(
                isLocalDevelopment 
                    ? "WebContainer requires HTTPS or localhost environment" 
                    : "Interactive development environment is only available in local development mode. Please run this project locally for full functionality."
            );
            return;
        }
        
        setIsWebContainerInitializing(true);
        
        try {
            console.log("Initializing webContainer...");
            const container = await getWebContainer();
            setWebContainer(container);
            console.log("WebContainer initialized successfully");
            setErrorMessage('');
        } catch (error) {
            console.error("Error initializing webContainer:", error);
            
            let userFriendlyMessage = "Development environment could not be initialized";
            
            if (error.message.includes('SharedArrayBuffer')) {
                userFriendlyMessage = "Development environment requires secure context. Please use HTTPS or localhost.";
            } else if (error.message.includes('Worker')) {
                userFriendlyMessage = "Web Workers are not supported in this browser/environment.";
            } else if (error.message.includes('not supported')) {
                userFriendlyMessage = "WebContainer is not supported in this environment.";
            }
            
            setErrorMessage(userFriendlyMessage);
        } finally {
            setIsWebContainerInitializing(false);
        }
    };

    const getProject = async () => {
        try {
            const response = await axios.get(`/projects/${projectId}`);
            setProject(response.data.project);
            setProjectFiles(response.data.project.fileTree);
            
            const fileObj = {};
            response.data.project.fileTree.forEach(file => {
                fileObj[file.path] = file.content;
            });
            setFiles(fileObj);
            
            if (response.data.project.fileTree.length > 0) {
                setCurrentFile(response.data.project.fileTree[0]);
            }
        } catch (error) {
            console.error('Error fetching project:', error);
        }
    };

    const handleInstall = async () => {
        if (!webContainer) {
            setErrorMessage('Development environment not initialized');
            return;
        }

        setIsInstalling(true);
        try {
            console.log("Installing dependencies...");
            await webContainer.mount(files);

            const installProcess = await webContainer.spawn('npm', ['install']);
            const installExitCode = await installProcess.exit;

            if (installExitCode !== 0) {
                throw new Error('Installation failed');
            }

            setInstalled(true);
            console.log("Dependencies installed successfully");
        } catch (error) {
            console.error('Installation error:', error);
            setErrorMessage('Failed to install dependencies: ' + error.message);
        } finally {
            setIsInstalling(false);
        }
    };

    const handleRun = async () => {
        if (!webContainer) {
            setErrorMessage('Development environment not initialized');
            return;
        }

        try {
            console.log("Starting development server...");
            const serverProcess = await webContainer.spawn('npm', ['run', 'dev']);

            serverProcess.output.pipeTo(
                new WritableStream({
                    write(data) {
                        console.log(data);
                    }
                })
            );

            webContainer.on('server-ready', (port, url) => {
                console.log(`Server ready at ${url}`);
                setIframeUrl(url);
            });
        } catch (error) {
            console.error('Run error:', error);
            setErrorMessage('Failed to start development server: ' + error.message);
        }
    };

    const sendMessageHandler = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            if (socket) {
                sendMessage(socket, {
                    message: input,
                    fileTree: projectFiles,
                    projectId: projectId
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error sending your message.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getProject();
        
        // Initialize WebContainer only if supported
        if (isWebContainerSupported()) {
            initializeWebContainer();
        } else {
            setErrorMessage(
                isLocalDevelopment 
                    ? "WebContainer requires HTTPS or localhost environment" 
                    : "Interactive development environment is only available locally"
            );
        }

        // Initialize socket
        const newSocket = initializeSocket();
        setSocket(newSocket);

        receiveMessage(newSocket, (data) => {
            setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        });

        return () => {
            if (newSocket) {
                disconnectSocket(newSocket);
            }
        };
    }, [projectId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const renderFileTree = (files, level = 0) => {
        return files.map((file, index) => (
            <div key={index} style={{ marginLeft: `${level * 20}px` }}>
                <div
                    className={`p-2 cursor-pointer hover:bg-gray-700 rounded ${
                        currentFile?.path === file.path ? 'bg-gray-600' : ''
                    }`}
                    onClick={() => setCurrentFile(file)}
                >
                    <span className="text-gray-300">
                        {file.type === 'folder' ? '📁' : '📄'} {file.name}
                    </span>
                </div>
                {file.children && renderFileTree(file.children, level + 1)}
            </div>
        ));
    };

    return (
        <main className='h-screen w-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 to-gray-800 text-white'>
            {/* Left Section - Project Info & Chat */}
            <section className="left w-full md:w-1/3 lg:w-1/4 h-full bg-gray-800 border-r border-gray-700 flex flex-col">
                {/* Project Header */}
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-white mb-2">
                        {project.title || <Skeleton />}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {project.description || <Skeleton count={2} />}
                    </p>
                </div>

                {/* Error Message */}
                {errorMessage && (
                    <div className="mx-4 my-2 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-yellow-400 mr-2">⚠️</span>
                            <div>
                                <p className="text-yellow-100 text-sm font-medium">
                                    Development Environment Status
                                </p>
                                <p className="text-yellow-200 text-xs mt-1">
                                    {errorMessage}
                                </p>
                                {!isLocalDevelopment && (
                                    <p className="text-yellow-300 text-xs mt-2">
                                        💡 To enable full functionality, run: <code className="bg-yellow-800 px-1 rounded">npm start</code> locally
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* WebContainer Status */}
                {isWebContainerInitializing && (
                    <div className="mx-4 my-2 p-3 bg-blue-900 border border-blue-700 rounded-lg">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                            <span className="text-blue-100 text-sm">Initializing development environment...</span>
                        </div>
                    </div>
                )}

                {/* Chat Toggle */}
                <div className="p-4">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        💬 {isChatOpen ? 'Hide' : 'Show'} AI Assistant
                    </button>
                </div>

                {/* Chat Section */}
                {isChatOpen && (
                    <div className="flex-grow flex flex-col min-h-0">
                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                                        message.role === 'user' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-700 text-gray-100'
                                    }`}>
                                        <Markdown
                                            options={{
                                                overrides: {
                                                    code: {
                                                        component: SyntaxHighlightedCode,
                                                    },
                                                },
                                            }}
                                        >
                                            {message.content}
                                        </Markdown>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-700 text-gray-100 px-3 py-2 rounded-lg">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <div className="p-4 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessageHandler()}
                                    placeholder="Ask about the code..."
                                    className="flex-grow bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={sendMessageHandler}
                                    disabled={isLoading || !input.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Right Section - Code Editor */}
            <section className="right bg-gray-900 flex-grow h-full flex">
                {/* File Explorer */}
                <div className="w-64 bg-gray-800 border-r border-gray-700 h-full overflow-y-auto">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-semibold text-white">Files</h2>
                    </div>
                    <div className="p-2">
                        {projectFiles.length > 0 ? renderFileTree(projectFiles) : <Skeleton count={5} />}
                    </div>
                </div>

                {/* Code Editor */}
                {currentFile && (
                    <div className="code-editor flex flex-col flex-grow h-full">
                        <div className="top flex justify-between items-center w-full bg-gray-800 p-2 border-b border-gray-700">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-300">📄 {currentFile.name}</span>
                            </div>
                            
                            {/* Install/Run Controls */}
                            <div className="flex items-center gap-2">
                                {!isWebContainerSupported() ? (
                                    <div className="px-3 py-1 bg-yellow-900 text-yellow-100 rounded text-sm">
                                        🔒 Run/Install only available locally
                                    </div>
                                ) : isWebContainerInitializing ? (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-900 text-blue-100 rounded text-sm">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                                        Initializing...
                                    </div>
                                ) : !webContainer ? (
                                    <div className="px-3 py-1 bg-red-900 text-red-100 rounded text-sm">
                                        ❌ Environment unavailable
                                    </div>
                                ) : !installed ? (
                                    <button
                                        onClick={handleInstall}
                                        disabled={isInstalling}
                                        className={`px-4 py-2 text-white rounded-lg transition-all text-sm ${
                                            isInstalling
                                                ? 'bg-gray-600 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {isInstalling ? '⏳ Installing...' : '📦 Install'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRun}
                                        className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all text-sm"
                                    >
                                        ▶️ Run
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Code Content */}
                        <div className="flex-grow overflow-auto bg-gray-900">
                            <pre className="p-4 text-sm text-gray-100 font-mono whitespace-pre-wrap">
                                <code>
                                    {currentFile.content || 'Loading...'}
                                </code>
                            </pre>
                        </div>
                    </div>
                )}

                {/* Preview Iframe */}
                {iframeUrl && webContainer && isWebContainerSupported() && (
                    <div className="flex min-w-96 flex-col h-full bg-gray-800 border-l border-gray-700">
                        <div className="p-2 bg-gray-800 border-b border-gray-700">
                            <h3 className="text-white font-medium">🌐 Live Preview</h3>
                        </div>
                        <iframe
                            src={iframeUrl}
                            className="flex-grow w-full bg-white"
                            title="Project Preview"
                        />
                    </div>
                )}
            </section>
        </main>
    );
};

export default Project;

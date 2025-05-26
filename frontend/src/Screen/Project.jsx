import React, { useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { UserContext } from '../Context/User.context';
import axios from '../config/Axios';
import { initializeSocket, receiveMessage, sendMessage, disconnectSocket } from '../config/Socket';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // or any preferred theme
import { getWebContainer } from '../config/webContainer';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

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
    const location = useLocation();
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState([]);
    const [users, setUsers] = useState([]);
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState('');
    const messagebox = useRef(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([])
    const [webContainer, setWebContainer] = useState(null)
    const [fileTree, setFileTree] = useState({});
    const [iframeUrl, setIframeUrl] = useState(null);
    const [runProcess, setRunProcess] = useState(null);
    const [installed, setInstalled] = useState(false);
    const [hoveredFile, setHoveredFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const { user } = useContext(UserContext);

    useEffect(() => {
        const socket = initializeSocket(project._id);

        const handleMessage = (data) => {
            if (data.sender._id === 'ai') {
                console.log("AI response detected. Setting isLoading to true.");
                setIsLoading(true); // Start showing skeleton

                const skeletonTimeout = setTimeout(() => {
                    console.log("Minimum skeleton duration elapsed. Setting isLoading to false.");
                    setIsLoading(false); // Stop showing skeleton after minimum delay
                }, 1500);

                const aiResponseTimeout = setTimeout(() => {
                    console.log("AI response timeout. Showing error message.");
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        { message: "Prompt is wrong or Modify the Prompt Better Instruction", sender: { email: "AI" } }
                    ]);
                    setIsLoading(false); // Stop showing skeleton
                }, 10000); // 10 seconds timeout for AI response

                try {
                    const message = JSON.parse(data.message);
                    console.log("Parsed AI message:", message);

                    if (message && (message.fileTree || message.text)) {
                        if (message.fileTree) {
                            console.log("Mounting file tree from AI response.");
                            webContainer?.mount(message.fileTree);
                            setFileTree(message.fileTree || {});
                        }

                        console.log("Adding AI message to chat.");
                        setMessages((prevMessages) => [...prevMessages, data]);
                        clearTimeout(skeletonTimeout); // Clear timeout if AI responds before minimum delay
                        clearTimeout(aiResponseTimeout); // Clear AI response timeout
                        setIsLoading(false); // Stop showing skeleton immediately
                    } else {
                        console.log("Invalid AI message format.");
                        setMessages((prevMessages) => [
                            ...prevMessages,
                            { message: "Prompt is wrong or Modify the Prompt Better Instruction", sender: { email: "AI" } }
                        ]);
                        clearTimeout(skeletonTimeout); // Clear timeout on invalid message
                        clearTimeout(aiResponseTimeout); // Clear AI response timeout
                        setIsLoading(false); // Stop showing skeleton
                    }
                } catch (error) {
                    console.error("Error parsing AI message:", error);
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        { message: "Prompt is wrong or Modify the Prompt Better Instruction", sender: { email: "AI" } }
                    ]);
                    clearTimeout(skeletonTimeout); // Clear timeout on error
                    clearTimeout(aiResponseTimeout); // Clear AI response timeout
                    setIsLoading(false); // Stop showing skeleton
                }
            } else {
                console.log("Non-AI message received.");
                setMessages((prevMessages) => [...prevMessages, data]);
            }
        };

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container created")
            })
        }

        receiveMessage('project-message', handleMessage);

        fetchUsers();

        axios.get(`/project/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project);
            setFileTree(res.data.project.fileTree || {})
        });

        return () => {
            if (socket) {
                socket.off('project-message', handleMessage); // Use the stored socket instance
                socket.disconnect(); // Properly disconnect on component unmount
            }
        };
    }, [project._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /// ano use atle thay che ke je data ai na response mathi ave te object base ave che to tene text base karva mate write ai function use thay  che.

    // function WriteAiMessage(message) {


    //     const messageObject = JSON.parse(message)

    //     return (
    //         <div
    //             className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
    //         >
    //             <Markdown
    //                 options={{
    //                     overrides: {
    //                         code: {
    //                             component: SyntaxHighlightedCode,
    //                         },
    //                     },
    //                 }}
    //             >
    //                 {messageObject.text}
    //             </Markdown>
    //         </div>)
    // }

    function WriteAiMessage(message) {
        try {
            const messageObject = JSON.parse(message);

            // Check if the message contains text
            if (messageObject && messageObject.text) {
                return (
                    <div className='overflow-auto bg-slate-950 text-white rounded-sm p-2'>
                        <Markdown
                            options={{
                                overrides: {
                                    code: {
                                        component: SyntaxHighlightedCode,
                                    },
                                },
                            }}
                        >
                            {messageObject.text}
                        </Markdown>
                    </div>
                );
            } else {
                throw new Error("Invalid message format: 'text' field missing.");
            }
        } catch (error) {
            console.error("Error parsing AI message:", error);
            return (
                <div className='overflow-auto bg-red-500 text-white rounded-sm p-2'>
                    Prompt is wrong or modify the prompt with better instructions.
                </div>
            );
        }
    }



    const scrollToBottom = () => {
        if (messagebox.current) {
            messagebox.current.scrollTop = messagebox.current.scrollHeight;
        }
    };

    const send = (e) => {
        e.preventDefault();

        sendMessage('project-message', {
            message,
            sender: user
        });
        setMessages(prevMessages => [...prevMessages, { sender: user, message }]) // Update messages state
        setMessage("")
        console.log(messages)

    };


    // const send = (e) => {
    //     e.preventDefault();

    //     const newMessage = {
    //         message,
    //         sender: user,
    //         projectId: project._id  // Ensure project ID is included
    //     };

    //     sendMessage('project-message', newMessage); // Send message via socket
    //     setMessages((prevMessages) => [...prevMessages, newMessage]); // Update local state
    //     setMessage('');
    // };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/user/all');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const addCollaborators = async () => {
        axios.put('/project/add-user', {
            projectId: location.state.project._id,
            users: selectedUserId
        }).then((res) => {
            console.log('Collaborators added:', res.data);
            setIsModalOpen(false);
            setSelectedUserId([]);
        }).catch((error) => {
            console.log('Error adding collaborators:', error);
        });
    };

    const handleUserClick = (userId) => {
        setSelectedUserId((prevSelected) => {
            if (prevSelected.includes(userId)) {
                return prevSelected.filter((id) => id !== userId);
            }
            return [...prevSelected, userId];
        });
    };

    const toggleSidePanel = () => {
        setIsSidePanelOpen(!isSidePanelOpen);
    };

    function saveFileTree(ft) {
        axios.put('/project/update-file-tree', {
            projectId: project._id,
            fileTree: ft
        }).then(res => {
            console.log(res.data)
        }).catch(err => {
            console.log(err)
        })
    }


    const handleCreateFile = () => {
        // Prompt the user for a new file name
        const fileName = prompt("Enter new file name");
        if (!fileName) return; // Exit if no name provided

        // Check if the file already exists
        if (fileTree[fileName]) {
            alert("File already exists!");
            return;
        }

        // Create a new file object (you can customize the default content)
        const newFile = { file: { contents: "" } };

        // Update the file tree state with the new file
        const updatedFileTree = { ...fileTree, [fileName]: newFile };
        setFileTree(updatedFileTree);

        // Optionally, open the file immediately by updating currentFile and openFiles
        setCurrentFile(fileName);
        setOpenFiles((prevFiles) => [...new Set([...prevFiles, fileName])]);

        // Save the updated file tree to the database
        saveFileTree(updatedFileTree);
    };


    // const handleInstall = async () => {
    //     console.log("Installing dependencies...");
    //     // Install command execution

    //     await webContainer.mount(fileTree);

    //     const installProcess = await webContainer.spawn("npm", ["install"]);
    //     installProcess.output.pipeTo(new WritableStream({
    //         write(chunk) {
    //             console.log(chunk);
    //         }
    //     }));
    //     setTimeout(() => {
    //         setInstalled(true); // After installation, show run button
    //         console.log("Installation complete.");
    //     }, 2000); // Simulating install delay
    // };


    const handleInstall = async () => {
        if (!webContainer) {
            setErrorMessage('Web container is not ready yet. Please wait and try again.');
            return;
        }

        try {
            console.log("Installing dependencies...");
            await webContainer.mount(fileTree);

            const installProcess = await webContainer.spawn("npm", ["install"]);
            installProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    console.log(chunk);
                }
            }));

            setTimeout(() => {
                setInstalled(true);
                console.log("Installation complete.");
            }, 2000);

            setErrorMessage('');
        } catch (error) {
            console.error("Installation error:", error);
            setErrorMessage('Failed to install dependencies.');
        }
    };

    // const handleRun = async () => {
    //     console.log("Running the program...");
    //     // Run command execution
    //     if (runProcess) {
    //         runProcess.kill();
    //     }


    //     let tempRunProcess = await webContainer.spawn("npm", ["start"]);
    //     tempRunProcess.output.pipeTo(new WritableStream({
    //         write(chunk) {
    //             console.log(chunk);
    //         }
    //     }));

    //     setRunProcess(tempRunProcess);

    //     webContainer.on('server-ready', (port, url) => {
    //         console.log(port, url);
    //         setIframeUrl(url);
    //     });
    // };

    const handleRun = async () => {
        if (!webContainer) {
            setErrorMessage('Web container is not ready yet. Please wait and try again.');
            return;
        }

        try {
            console.log("Running the program...");
            if (runProcess) runProcess.kill();

            const tempRunProcess = await webContainer.spawn("npm", ["start"]);
            tempRunProcess.output.pipeTo(new WritableStream({
                write(chunk) {
                    console.log(chunk);
                }
            }));

            setRunProcess(tempRunProcess);

            webContainer.on('server-ready', (port, url) => {
                console.log(port, url);
                setIframeUrl(url);
            });

            setErrorMessage('');
        } catch (error) {
            console.error("Run error:", error);
            setErrorMessage('Failed to start the project.');
        }
    };

    useEffect(() => {
        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container);
                console.log("✅ Web container initialized");
            }).catch(err => {
                console.error("❌ Failed to initialize web container", err);
                setErrorMessage("Failed to initialize the web container.");
            });
        }
    }, []);

    const deleteFile = async (fileName) => {
        if (!fileTree[fileName]) return;

        const isConfirmed = window.confirm(`Are you sure you want to delete the file: ${fileName}?`);

        if (!isConfirmed) return; // If user cancels, do nothing

        try {
            await axios.delete('/project/delete-file', {
                data: {
                    projectId: project._id,
                    fileName: fileName
                }
            });

            // Update the UI by removing the file from the file tree
            const updatedFileTree = { ...fileTree };
            delete updatedFileTree[fileName];

            setFileTree(updatedFileTree);
            saveFileTree(updatedFileTree); // Save the updated file tree to the database
        } catch (error) {
            console.error("Error deleting file:", error);
        }
    };

    // const handleInstall = async () => {
    //     setInstalling(true);
    //     await webContainer.mount(fileTree);

    //     const installProcess = await webContainer.spawn("npm", ["install"]);
    //     installProcess.output.pipeTo(new WritableStream({
    //         write(chunk) {
    //             console.log(chunk);
    //         }
    //     }));

    //     setTimeout(() => {
    //         setInstalling(false);
    //         setInstalled(true);
    //     }, 30000); // Show Run button after 30 seconds
    // };

    // const handleRun = async () => {
    //     if (runProcess) {
    //         runProcess.kill();
    //     }

    //     let tempRunProcess = await webContainer.spawn("npm", ["start"]);
    //     tempRunProcess.output.pipeTo(new WritableStream({
    //         write(chunk) {
    //             console.log(chunk);
    //         }
    //     }));

    //     setRunProcess(tempRunProcess);

    //     webContainer.on('server-ready', (port, url) => {
    //         console.log(port, url);
    //         setIframeUrl(url);
    //     });
    // };
    return (
        <main className='h-screen w-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 to-gray-800 text-white'>
            {/* Left Section - Chat Panel */}
            {errorMessage && (
                <div className="p-3 text-sm text-red-400 bg-red-100 rounded-md">
                    {errorMessage}
                </div>
            )}

            <section className="left relative flex flex-col h-screen min-w-96 max-w-80 bg-gray-800 shadow-2xl">
                <header className='flex justify-between items-center p-4 w-full bg-gray-900 absolute z-10 top-0'>
                    <button
                        className='flex gap-2 items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all'
                        onClick={() => setIsModalOpen(true)}
                    >
                        <i className="ri-add-fill"></i>
                        <p>Add Collaborator</p>
                    </button>
                    <button
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                        onClick={toggleSidePanel}
                    >
                        <i className="ri-group-fill text-white"></i>
                    </button>
                </header>

                {/* Chat Messages */}
                <div className="conversation-area pb-10 flex-grow flex flex-col h-full relative">
                    <div
                        ref={messagebox}
                        className="message-box overflow-anchor-none mt-14 mb-3 p-1 px-0 flex-grow flex flex-col overflow-auto relative scrollbar-hide overflow-y-auto max-h-[calc(100vh-100px)]"
                    >
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.sender.email === user.email ? 'ml-auto' : ''} ${msg.sender._id === 'ai' ? 'max-w-80' : 'max-w-52'} flex flex-col p-3 m-2 rounded-lg transition-all`}
                                style={{
                                    background: msg.sender.email === user.email
                                        ? '#3b82f6' // Blue background for user's messages
                                        : '#4b5563', // Gray background for others' messages
                                    color: 'white', // White text for better contrast
                                }}
                            >
                                <small className='opacity-65 text-gray-200'>{msg.sender.email}</small>
                                <p className='p-2 rounded-lg'>
                                    {msg.sender._id === 'ai' ? WriteAiMessage(msg.message) : msg.message}
                                </p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="p-3 flex flex-col gap-2">
                                <Skeleton height={20} width="80%" baseColor="#e5e7eb" highlightColor="#f3f4f6" />
                                <Skeleton height={15} width="60%" baseColor="#e5e7eb" highlightColor="#f3f4f6" />
                            </div>
                        )}
                    </div>

                    {/* Message Input Field */}
                    <div className="inputField w-full flex absolute bottom-0 p-2 box bg-white z-10 border-t border-gray-200">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            type='text'
                            placeholder='Enter message'
                            className='w-80 m-2 px-4 ps-1 border border-gray-300 outline-none bg-white text-gray-900 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all'
                        />
                        <button
                            onClick={send}
                            className='flex-grow bg-blue-600 hover:bg-blue-700 rounded-lg text-white px-3 transition-all'
                        >
                            <i className="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>

                {/* Side Panel - Collaborators */}
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-gray-900 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0 shadow-2xl`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-gray-800'>
                        <h1 className='font-semibold text-lg text-white'>Collaborators</h1>
                        <button
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className='p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all'
                        >
                            <i className="ri-close-fill text-white"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2">
                        {project.users && project.users.map(user => (
                            <div
                                key={user._id}
                                className="user cursor-pointer hover:bg-gray-700 p-2 flex gap-2 items-center transition-all"
                            >
                                <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-blue-600'>
                                    <i className="ri-user-fill absolute"></i>
                                </div>
                                <h1 className='font-semibold text-lg text-white'>{user.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Right Section - Code Editor */}
            <section className="right bg-gray-900 flex-grow h-full flex">
                {/* File Explorer */}
                <div className="explorer h-full max-w-64 min-w-52 bg-gray-800 shadow-lg">
                    <div className="file-tree w-full">
                        <button
                            onClick={handleCreateFile}
                            className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-gray-700 hover:bg-gray-600 w-full transition-all"
                        >
                            <i className="ri-add-line text-white"></i>
                            <p className='font-semibold text-lg text-white'>New File</p>
                        </button>
                        {fileTree && Object.keys(fileTree).length > 0 ? (
                            Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentFile(file);
                                        setOpenFiles([...new Set([...openFiles, file])]);
                                    }}
                                    onMouseEnter={() => setHoveredFile(file)}
                                    onMouseLeave={() => setHoveredFile(null)}
                                    className="tree-element cursor-pointer p-2 px-4 flex items-center justify-between gap-2 bg-gray-700 hover:bg-gray-600 w-full transition-all"
                                >
                                    <p className='font-semibold text-lg text-white'>{file}</p>
                                    {hoveredFile === file && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteFile(file);
                                            }}
                                            className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                            ❌
                                        </button>
                                    )}
                                </button>
                            ))
                        ) : (
                            <p className="text-center p-2 text-gray-400">No files found</p>
                        )}
                    </div>
                </div>

                {/* Code Editor */}
                {currentFile && (
                    <div className="code-editor flex flex-col flex-grow h-full shrink">
                        <div className="top flex justify-between w-full bg-gray-800 p-2">
                            <div className="files flex">
                                {openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-gray-700 hover:bg-gray-600 ${currentFile === file ? 'bg-gray-600' : ''} transition-all`}
                                    >
                                        <p className='font-semibold text-lg text-white'>{file}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col items-center gap-4 p-4">
                                {!installed ? (
                                    <button
                                        onClick={handleInstall}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                                    >
                                        Install
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleRun}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
                                    >
                                        Run
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="bottom flex-grow flex max-w-full shrink overflow-auto bg-gray-900">
                            {fileTree[currentFile] && (
                                <div className="code-editor-area h-full overflow-auto flex-grow bg-gray-800">
                                    <pre className="hljs h-full">
                                        <code
                                            className="hljs h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [currentFile]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                };
                                                setFileTree(ft);
                                                saveFileTree(ft);
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[currentFile].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        />
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Iframe for Preview */}
                {iframeUrl && webContainer && (
                    <div className="flex min-w-96 flex-col h-full bg-gray-800">
                        <div className="address-bar bg-gray-900 p-2">
                            <input
                                type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl}
                                className="w-full p-2 px-4 bg-gray-700 text-white rounded-lg outline-none"
                            />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full  bg-slate-300"></iframe>
                    </div>
                )}
            </section>

            {/* Modal for Adding Collaborators */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-gray-900 p-4 rounded-md w-96 max-w-full relative shadow-2xl">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold text-white'>Select User</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className='p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all'
                            >
                                <i className="ri-close-fill text-white"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users
                                .filter(user => !project.users.some(collaborator => collaborator._id === user._id))
                                .map(user => (
                                    <div
                                        key={user._id}
                                        className={`user cursor-pointer hover:bg-gray-700 ${selectedUserId.includes(user._id) ? 'bg-gray-700' : 'bg-gray-800'} p-2 flex gap-2 items-center transition-all`}
                                        onClick={() => handleUserClick(user._id)}
                                    >
                                        <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-blue-600'>
                                            <i className="ri-user-fill absolute"></i>
                                        </div>
                                        <h1 className='font-semibold text-lg text-white'>{user.email}</h1>
                                    </div>
                                ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all'
                        >
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Project;

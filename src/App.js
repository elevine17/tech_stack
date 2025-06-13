import React, { useState, useEffect, useRef } from 'react';

// --- Data Configuration ---
// This object defines all the components in your tech stack.
// `layer`: 1 for Core Systems, 2 for Applications, 3 for Services.
// `pos`: Vertical position percentage (0-100).
const nodesConfig = {
    // Layer 1: Core Systems
    crm: { id: 'crm', text: 'CRM', icon: '👥', isHub: true, layer: 1, pos: 25 },
    cms: { id: 'cms', text: 'Headless CMS', icon: '📝', isHub: true, layer: 1, pos: 50 },
    edw: { id: 'edw', text: 'EDW / Looker', icon: '💾', isHub: true, layer: 1, pos: 75 },
    
    // Layer 2: Applications (Client-Facing)
    agentWebsite: { id: 'agentWebsite', text: 'Agent Website', icon: '🌐', layer: 2, pos: 33 },
    spw: { id: 'spw', text: 'Single Prop. Websites', icon: '🏘️', layer: 2, pos: 66 },

    // Layer 3: Services & Solutions
    idx: { id: 'idx', text: 'IDX Provider', icon: '🏠', layer: 3, pos: 10 },
    mls: { id: 'mls', text: 'Local MLS', icon: '🏛️', layer: 3, pos: 20 },
    googleAnalytics: { id: 'googleAnalytics', text: 'Google Analytics', icon: '📊', layer: 3, pos: 30 },
    googleAds: { id: 'googleAds', text: 'Google Ads', icon: '📢', layer: 3, pos: 40 },
    email: { id: 'email', text: 'Email Marketing', icon: '📧', layer: 3, pos: 50 },
    creative: { id: 'creative', text: 'Creative Suite', icon: '🎨', layer: 3, pos: 60 },
    printMail: { id: 'printMail', text: 'Print/Mail Partner', icon: '📮', layer: 3, pos: 70 },
    social: { id: 'social', text: 'Social Scheduler', icon: '📱', layer: 3, pos: 80 },
    taskManager: { id: 'taskManager', text: 'Task Manager', icon: '✅', layer: 3, pos: 90 },
    kwCommand: { id: 'kwCommand', text: 'KW Command', icon: '📄', layer: 3, pos: 98 },
    zapier: { id: 'zapier', text: 'Zapier', icon: '⚡', layer: 3, pos: 2 },
};

// This array defines the connections between the nodes.
// `type`: 'direct' for solid blue lines (API), 'indirect' for dashed gray (Zapier/Manual).
const connectionsConfig = [
    { from: 'idx', to: 'agentWebsite', label: 'Listing Data', type: 'direct' },
    { from: 'idx', to: 'spw', label: 'Listing Data', type: 'direct' },
    { from: 'cms', to: 'agentWebsite', label: 'Content', type: 'direct' },
    { from: 'cms', to: 'spw', label: 'Content', type: 'direct' },
    { from: 'agentWebsite', to: 'crm', label: 'Leads', type: 'direct' },
    { from: 'spw', to: 'crm', label: 'Leads', type: 'direct' },
    { from: 'agentWebsite', to: 'googleAnalytics', label: 'Analytics', type: 'direct' },
    { from: 'spw', to: 'googleAnalytics', label: 'Analytics', type: 'direct' },
    { from: 'mls', to: 'idx', label: 'RESO Feed', type: 'direct' },
    { from: 'mls', to: 'edw', label: 'Data Sync', type: 'direct' },
    { from: 'crm', to: 'googleAds', label: 'Offline Conversions', type: 'indirect' },
    { from: 'crm', to: 'email', label: 'Start Drip', type: 'indirect' },
    { from: 'crm', to: 'taskManager', label: 'Create Tasks', type: 'indirect' },
    { from: 'crm', to: 'kwCommand', label: 'Compliance Docs', type: 'indirect' },
    { from: 'edw', to: 'crm', label: 'Insights/Flags', type: 'indirect' },
    { from: 'cms', to: 'email', label: 'Newsletter Draft', type: 'indirect' },
    { from: 'cms', to: 'social', label: 'Post Draft', type: 'indirect' },
    { from: 'creative', to: 'email', label: 'Assets', type: 'indirect' },
    { from: 'creative', to: 'social', label: 'Assets', type: 'indirect' },
    { from: 'creative', to: 'printMail', label: 'Artwork', type: 'indirect' },
];

// --- Components ---

// Renders a single application/service node in the diagram
const Node = ({ node, layerXPositions }) => (
    <div
        id={node.id}
        className={`absolute flex flex-col items-center justify-center w-36 h-28 p-4 text-center transition-all duration-300 ease-in-out border rounded-xl shadow-lg bg-gray-800 border-gray-600 hover:border-sky-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/20 ${node.isHub ? 'hub border-sky-500 bg-blue-900 text-white' : ''}`}
        style={{
            left: `${layerXPositions[node.layer]}%`,
            top: `${node.pos}%`,
            transform: 'translate(-50%, -50%)',
        }}
    >
        <div className="text-3xl mb-1">{node.icon}</div>
        <div className="font-semibold text-sm leading-tight">{node.text}</div>
    </div>
);

// Renders a connection line, label, and arrowhead between two nodes
const ConnectionLine = ({ fromNode, toNode, label, type, positions }) => {
    if (!positions[fromNode.id] || !positions[toNode.id]) return null;

    const { x: fromX, y: fromY } = positions[fromNode.id];
    const { x: toX, y: toY } = positions[toNode.id];

    const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
    const fromRadius = 70;
    const toRadius = 70;
    
    const fromOffsetX = Math.cos(angle * Math.PI / 180) * fromRadius;
    const fromOffsetY = Math.sin(angle * Math.PI / 180) * fromRadius;
    const toOffsetX = Math.cos(angle * Math.PI / 180) * toRadius;
    const toOffsetY = Math.sin(angle * Math.PI / 180) * toRadius;
    
    const lineStartX = fromX + fromOffsetX;
    const lineStartY = fromY + fromOffsetY;
    const lineEndX = toX - toOffsetX;
    const lineEndY = toY - toOffsetY;
    
    const distance = Math.sqrt(Math.pow(lineEndX - lineStartX, 2) + Math.pow(lineEndY - lineStartY, 2));

    const lineClasses = type === 'direct'
        ? 'bg-blue-500 h-[3px]'
        : 'bg-transparent bg-[linear-gradient(to_right,theme(colors.gray.400)_50%,transparent_50%)] bg-[length:12px_2px] h-[2px]';

    const arrowheadClasses = type === 'direct' ? 'border-l-blue-500' : 'border-l-gray-400';

    const midX = (lineStartX + lineEndX) / 2;
    const midY = (lineStartY + lineEndY) / 2;
    const labelOffsetX = Math.sin(angle * Math.PI / 180) * 15;
    const labelOffsetY = -Math.cos(angle * Math.PI / 180) * 15;

    return (
        <>
            <div
                className={`absolute transform-origin-left pointer-events-none ${lineClasses}`}
                style={{ left: `${lineStartX}px`, top: `${lineStartY}px`, width: `${distance}px`, transform: `rotate(${angle}deg)` }}
            />
            <div
                className={`absolute w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] pointer-events-none ${arrowheadClasses}`}
                style={{ left: `${lineEndX}px`, top: `${lineEndY}px`, transform: `translate(-10px, -6px) rotate(${angle}deg)` }}
            />
            <div
                className="absolute px-2 py-0.5 text-xs whitespace-nowrap -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-gray-900 border border-gray-700 rounded-md text-gray-400"
                style={{
                    left: `${midX + labelOffsetX}px`,
                    top: `${midY + labelOffsetY}px`,
                    transform: `translate(-50%, -50%) rotate(${angle > 90 || angle < -90 ? angle + 180 : angle}deg)`
                }}
            >
                {label}
            </div>
        </>
    );
};


// Main Application Component
export default function App() {
    const diagramRef = useRef(null);
    const [nodePositions, setNodePositions] = useState({});
    
    const layerXPositions = { 1: 20, 2: 50, 3: 80 };
    const layerTitles = { 1: 'Core Systems', 2: 'Applications', 3: 'Services & Solutions' };

    // This effect calculates the absolute pixel positions of each node.
    // It runs once on mount and again if the window resizes.
    useEffect(() => {
        const calculatePositions = () => {
            if (!diagramRef.current) return;
            const diagramWidth = diagramRef.current.offsetWidth;
            const diagramHeight = diagramRef.current.offsetHeight;
            const newPositions = {};
            Object.values(nodesConfig).forEach(node => {
                newPositions[node.id] = {
                    x: (layerXPositions[node.layer] / 100) * diagramWidth,
                    y: (node.pos / 100) * diagramHeight,
                };
            });
            setNodePositions(newPositions);
        };

        calculatePositions();
        window.addEventListener('resize', calculatePositions);
        return () => window.removeEventListener('resize', calculatePositions);
    }, []);

    return (
        <div className="bg-gray-900 text-gray-300 min-h-screen p-4 sm:p-6 md:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">The Modern Realtor's Technology Ecosystem</h1>
                    <p className="mt-2 text-lg text-gray-400">A Blueprint for a Scalable Real Estate Business in Park City</p>
                </header>
                
                <div id="view-architecture">
                    <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-blue-500 rounded"></div>
                            <span className="text-sm font-medium">Direct API Integration</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-1 rounded border-2 border-dashed border-gray-500"></div>
                            <span className="text-sm font-medium">Loosely Coupled (Zapier/Manual)</span>
                        </div>
                    </div>
                    <div id="architecture-diagram" ref={diagramRef} className="relative min-h-[1200px] w-full">
                        {/* Layer Titles */}
                        {Object.entries(layerTitles).map(([layerNum, title]) => (
                             <div key={title} className="absolute top-1/2 -translate-y-1/2 text-gray-500 font-semibold uppercase text-sm [writing-mode:vertical-rl] transform -rotate-180 tracking-widest"
                                style={{ left: `calc(${layerXPositions[layerNum]}% - 100px)`}}>
                                {title}
                            </div>
                        ))}

                        {/* Nodes */}
                        {Object.values(nodesConfig).map(node => (
                            <Node key={node.id} node={node} layerXPositions={layerXPositions} />
                        ))}
                        
                        {/* Connections */}
                        {Object.keys(nodePositions).length > 0 && connectionsConfig.map((conn, index) => (
                            <ConnectionLine 
                                key={index} 
                                fromNode={nodesConfig[conn.from]} 
                                toNode={nodesConfig[conn.to]} 
                                label={conn.label} 
                                type={conn.type} 
                                positions={nodePositions} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

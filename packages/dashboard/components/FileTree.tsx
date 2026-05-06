/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Author   : Frandy Slueue
 * Alias    : CodeBreeder
 * Title    : Software Engineering · DevOps Security · IT Ops
 * Portfolio: https://frandycode.dev
 * GitHub   : https://github.com/frandycode
 * Email    : frandyslueue@gmail.com
 * Location : Tulsa, OK & Dallas, TX (Central Time)
 * Project  : PortDrop — collapsible file tree for code view
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use client';

import { useEffect, useState } from 'react';

export interface FileNode {
  name:      string;
  path:      string;
  type:      'file' | 'directory';
  children?: FileNode[];
}

interface FileTreeProps {
  sessionId:    string;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
}

// ── Single tree node ──────────────────────────────────────────────────────────

function TreeNode({
  node,
  selectedPath,
  onSelectFile,
  depth,
}: {
  node:         FileNode;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  depth:        number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const isSelected = node.path === selectedPath;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         6,
            width:       '100%',
            background:  'none',
            border:      'none',
            cursor:      'pointer',
            padding:     `3px 8px 3px ${8 + depth * 14}px`,
            textAlign:   'left',
            color:       'rgba(212,168,83,0.7)',
            fontSize:    12,
            fontFamily:  "'JetBrains Mono', monospace",
            letterSpacing: '0.3px',
            borderRadius: 4,
            transition:  'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,133,58,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <span style={{ fontSize: 10, opacity: 0.6, flexShrink: 0 }}>
            {open ? '▼' : '▶'}
          </span>
          <span style={{ fontSize: 11, opacity: 0.5, flexShrink: 0 }}>📁</span>
          {node.name}
        </button>
        {open && node.children?.map(child => (
          <TreeNode
            key={child.path}
            node={child}
            selectedPath={selectedPath}
            onSelectFile={onSelectFile}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         6,
        width:       '100%',
        background:  isSelected ? 'rgba(196,133,58,0.15)' : 'none',
        border:      'none',
        borderLeft:  isSelected ? '2px solid #C48540' : '2px solid transparent',
        cursor:      'pointer',
        padding:     `3px 8px 3px ${8 + depth * 14}px`,
        textAlign:   'left',
        color:       isSelected ? '#D4A853' : 'rgba(212,168,83,0.6)',
        fontSize:    12,
        fontFamily:  "'JetBrains Mono', monospace",
        letterSpacing: '0.3px',
        borderRadius: '0 4px 4px 0',
        transition:  'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.background = 'rgba(196,133,58,0.08)';
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.background = 'none';
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.45, flexShrink: 0 }}>📄</span>
      {node.name}
    </button>
  );
}

// ── Root FileTree ─────────────────────────────────────────────────────────────

export function FileTree({ sessionId, selectedPath, onSelectFile }: FileTreeProps) {
  const [tree,   setTree]   = useState<FileNode[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
    fetch(`/api/code/files?sessionId=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then(data => {
        if (data.tree) { setTree(data.tree); setStatus('ready'); }
        else           { setStatus('error'); }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div style={{ padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(212,168,83,0.4)' }}>
        Loading files…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#ef4444' }}>
        Could not load file tree.
      </div>
    );
  }

  return (
    <div style={{
      height:     '100%',
      overflowY:  'auto',
      padding:    '8px 0',
      userSelect: 'none',
    }}>
      {tree.map(node => (
        <TreeNode
          key={node.path}
          node={node}
          selectedPath={selectedPath}
          onSelectFile={onSelectFile}
          depth={0}
        />
      ))}
    </div>
  );
}

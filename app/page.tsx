'use client';

import { useState, useEffect } from 'react';

interface User {
  name: string;
  mu: number; // mean time in hours (0-24)
  sigma: number; // standard deviation in hours
}

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentName, setCurrentName] = useState('');
  const [inputName, setInputName] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('scheduler-users');
    if (stored) {
      setUsers(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scheduler-users', JSON.stringify(users));
  }, [users]);

  const handleAddUser = () => {
    if (!inputName.trim()) return;
    const existing = users.find(u => u.name === inputName);
    if (existing) {
      setCurrentName(inputName);
    } else {
      const newUser: User = { name: inputName, mu: 12, sigma: 0.75 };
      setUsers([...users, newUser]);
      setCurrentName(inputName);
    }
    setInputName('');
  };

  const updateUser = (name: string, updates: Partial<User>) => {
    setUsers(users.map(u => u.name === name ? { ...u, ...updates } : u));
  };

  const gaussian = (x: number, mu: number, sigma: number) => {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  };

  const currentUser = users.find(u => u.name === currentName);

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Meeting Scheduler</h1>
      {!currentUser ? (
        <div className="mb-8">
          <input
            type="text"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Enter your name"
            className="border p-2 mr-2"
            onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
          />
          <button onClick={handleAddUser} className="bg-blue-500 text-white px-4 py-2 rounded">
            Enter
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <p>Editing schedule for: <strong>{currentName}</strong></p>
          <button onClick={() => setCurrentName('')} className="text-sm text-blue-500 underline">
            Change user
          </button>
        </div>
      )}
      <SchedulerGraph users={users} currentUser={currentUser} updateUser={updateUser} />
      {users.length > 0 && (
        <button
          onClick={() => {
            setUsers([]);
            setCurrentName('');
            localStorage.removeItem('scheduler-users');
          }}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Clear All Curves
        </button>
      )}
    </div>
  );
}

interface SchedulerGraphProps {
  users: User[];
  currentUser: User | undefined;
  updateUser: (name: string, updates: Partial<User>) => void;
}

function SchedulerGraph({ users, currentUser, updateUser }: SchedulerGraphProps) {
  const gaussian = (x: number, mu: number, sigma: number) => {
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  };
  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = (x: number) => (x / 24) * innerWidth + margin.left;
  const yScale = (y: number) => height - margin.bottom - (y / 0.4) * innerHeight; // assuming max density ~0.4

  const paths = users.map((user, i) => {
    const points = [];
    for (let x = 0; x <= 24; x += 0.1) {
      const y = gaussian(x, user.mu, user.sigma);
      points.push(`${xScale(x)},${yScale(y)}`);
    }
    return (
      <path
        key={user.name}
        d={`M ${points.join(' L ')}`}
        stroke={colors[i % colors.length]}
        strokeWidth="2"
        fill="none"
        opacity="0.7"
      />
    );
  });

  const [dragging, setDragging] = useState<{ type: 'mu' | 'sigma', user: string } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, type: 'mu' | 'sigma', userName: string) => {
    setDragging({ type, user: userName });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left - margin.left) / innerWidth) * 24;
    const user = users.find(u => u.name === dragging.user);
    if (!user) return;
    if (dragging.type === 'mu') {
      updateUser(dragging.user, { mu: Math.max(0, Math.min(24, x)) });
    } else if (dragging.type === 'sigma') {
      const newSigma = Math.abs(x - user.mu);
      updateUser(dragging.user, { sigma: Math.max(0.1, newSigma) });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const draggablePoints = currentUser ? (
    <>
      {/* Midpoint */}
      <circle
        cx={xScale(currentUser.mu)}
        cy={yScale(gaussian(currentUser.mu, currentUser.mu, currentUser.sigma))}
        r="5"
        fill={colors[users.findIndex(u => u.name === currentUser.name) % colors.length]}
        onMouseDown={(e) => handleMouseDown(e, 'mu', currentUser.name)}
        style={{ cursor: 'pointer' }}
      />
      {/* Left sigma point */}
      <circle
        cx={xScale(currentUser.mu - currentUser.sigma)}
        cy={yScale(gaussian(currentUser.mu - currentUser.sigma, currentUser.mu, currentUser.sigma))}
        r="4"
        fill={colors[users.findIndex(u => u.name === currentUser.name) % colors.length]}
        onMouseDown={(e) => handleMouseDown(e, 'sigma', currentUser.name)}
        style={{ cursor: 'pointer' }}
      />
      {/* Right sigma point */}
      <circle
        cx={xScale(currentUser.mu + currentUser.sigma)}
        cy={yScale(gaussian(currentUser.mu + currentUser.sigma, currentUser.mu, currentUser.sigma))}
        r="4"
        fill={colors[users.findIndex(u => u.name === currentUser.name) % colors.length]}
        onMouseDown={(e) => handleMouseDown(e, 'sigma', currentUser.name)}
        style={{ cursor: 'pointer' }}
      />
    </>
  ) : null;

  return (
    <div>
      <svg
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="border"
      >
        {/* Axes */}
        <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} stroke="black" />
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="black" />
        {/* X ticks */}
        {Array.from({ length: 25 }, (_, i) => (
          <g key={i}>
            <line x1={xScale(i)} y1={height - margin.bottom} x2={xScale(i)} y2={height - margin.bottom + 5} stroke="black" />
            <text x={xScale(i)} y={height - margin.bottom + 15} textAnchor="middle" fontSize="10">{i}</text>
          </g>
        ))}
        {/* Y axis label */}
        <text x={margin.left - 30} y={height / 2} textAnchor="middle" transform={`rotate(-90, ${margin.left - 30}, ${height / 2})`} fontSize="12">Density</text>
        {/* X axis label */}
        <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="12">Time (hours)</text>
        {/* Paths */}
        {paths}
        {/* Vertical lines at peaks */}
        {users.map((user, i) => {
          const peakY = gaussian(user.mu, user.mu, user.sigma);
          return (
            <line
              key={`line-${user.name}`}
              x1={xScale(user.mu)}
              y1={yScale(peakY)}
              x2={xScale(user.mu)}
              y2={height - margin.bottom}
              stroke={colors[i % colors.length]}
              strokeDasharray="5,5"
              strokeWidth="1"
            />
          );
        })}
        {/* Draggable points */}
        {draggablePoints}
      </svg>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {users.map((user, i) => (
            <div key={user.name} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[i % colors.length] }}
              ></div>
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

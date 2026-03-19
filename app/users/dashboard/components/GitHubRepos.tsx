'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useTheme } from '../../../../contexts/ThemeContext';
import { useToast } from '../../../../contexts/ToastContext';

interface Repo {
    id: number;
    name: string;
    html_url: string;
    description: string;
    stargazers_count: number;
    language: string;
    updated_at: string;
    private: boolean;
}

interface GitHubReposProps {
    searchTerm?: string;
}

export default function GitHubRepos({ searchTerm = '' }: GitHubReposProps) {
    const { theme } = useTheme();
    const { error } = useToast();
    const [repos, setRepos] = useState<Repo[]>([]);
    const [loading, setLoading] = useState(false);
    const [githubConnected, setGithubConnected] = useState(true);

    const filteredRepos = searchTerm
        ? repos.filter(repo =>
            repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (repo.language && repo.language.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : repos;

    useEffect(() => {
        const fetchRepos = async () => {
            const userCookie = Cookies.get('user');
            if (!userCookie) return;

            try {
                const { email } = JSON.parse(userCookie);
                setLoading(true);
                const res = await fetch('/api/users/dashboard/github-repos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const data = await res.json();
                if (data.success) {
                    setRepos(data.repos);
                    setGithubConnected(true);
                } else {
                    setGithubConnected(false);
                }
            } catch (err) {
                console.error('GitHub repos fetch error', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRepos();
    }, []);

    if (!githubConnected && !loading) {
        return (
            <div className={`rounded-4xl shadow-sm border p-8 flex flex-col items-center justify-center h-[30rem] text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <img src="https://github.com/favicon.ico" className="w-8 h-8 invert opacity-50" alt="GitHub" />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Connection Missing</h3>
                <p className={`text-sm max-w-[200px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Your GitHub account is not fully synced. Please reconnect.
                </p>
            </div>
        );
    }

    return (
        <div className={` flex flex-col h-[45rem] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg">
                        <img src="https://github.com/favicon.ico" className="w-6 h-6 invert" alt="GitHub" />
                    </div>
                    <div>
                        <h3 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Your Repositories
                        </h3>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                            Live from GitHub
                        </p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full uppercase">Synced</div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-24 rounded-2xl animate-pulse ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}></div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {filteredRepos.map((repo) => (
                        <a
                            key={repo.id}
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group block border rounded-xl p-3 transition-all duration-200 hover:shadow-md ${theme === 'dark'
                                ? 'border-gray-700 bg-gray-700/20 hover:bg-gray-700/40'
                                : 'border-gray-100 bg-gray-50 hover:bg-white'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h4 className={`font-bold text-sm group-hover:text-blue-500 transition-colors truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {repo.name}
                                    </h4>
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-px rounded-full shrink-0 ${repo.private ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {repo.private ? 'Private' : 'Public'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-px rounded-full shrink-0 ml-2">
                                    <span className="text-[9px] text-yellow-500">★</span>
                                    <span className="text-[9px] text-yellow-500 font-black">{repo.stargazers_count}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {repo.language || 'Code'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500">
                                    {new Date(repo.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </a>
                    ))}
                    {filteredRepos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <p className="text-sm font-bold">
                                {searchTerm ? 'No matching repositories found.' : 'No repositories found.'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

import { Star, GitFork, Circle } from 'lucide-react';
import { cn, formatNumber, getLangColor, timeAgo } from '../../utils/helpers';

const RepoCard = ({ repo, loading = false }) => {
  if (loading) {
    return (
      <div className="card p-4">
        <div className="skeleton w-40 h-4 rounded mb-2" />
        <div className="skeleton w-full h-3 rounded mb-3" />
        <div className="flex gap-3">
          <div className="skeleton w-12 h-3 rounded" />
          <div className="skeleton w-12 h-3 rounded" />
        </div>
      </div>
    );
  }

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="card p-4 block hover:border-gray-500 transition-all duration-200 group no-underline"
    >
      {/* Name + visibility */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 truncate transition-colors">
          {repo.name}
        </span>
        {repo.private ? (
          <span className="badge-gray text-xs shrink-0">Private</span>
        ) : (
          <span className="badge-gray text-xs shrink-0">Public</span>
        )}
        {repo.fork && (
          <span className="badge-gray text-xs shrink-0">Fork</span>
        )}
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-xs text-gh-muted mb-3 line-clamp-2 leading-relaxed">
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="badge-blue text-xs">{t}</span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gh-muted">
        {repo.language && (
          <div className="flex items-center gap-1">
            <Circle
              size={10}
              fill={getLangColor(repo.language)}
              color={getLangColor(repo.language)}
            />
            <span>{repo.language}</span>
          </div>
        )}
        {repo.stargazers_count > 0 && (
          <div className="flex items-center gap-1">
            <Star size={12} />
            <span>{formatNumber(repo.stargazers_count)}</span>
          </div>
        )}
        {repo.forks_count > 0 && (
          <div className="flex items-center gap-1">
            <GitFork size={12} />
            <span>{formatNumber(repo.forks_count)}</span>
          </div>
        )}
        {repo.updated_at && (
          <span className="ml-auto">Updated {timeAgo(repo.updated_at)}</span>
        )}
      </div>
    </a>
  );
};

export default RepoCard;

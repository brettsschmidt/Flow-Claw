import React from 'react';

export default function MarkdownRenderer({ html, frontmatter }) {
  if (!html) return null;

  const status = frontmatter?.status;
  const statusStyles = {
    complete:    'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    in_progress: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    blocked:     'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
    pending:     'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  };

  return (
    <div>
      {frontmatter && Object.keys(frontmatter).length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {status && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.pending}`}>
              {status}
            </span>
          )}
          {frontmatter.step !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
              step {frontmatter.step}
            </span>
          )}
          {frontmatter.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
              #{tag}
            </span>
          ))}
          {frontmatter.depends_on?.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              depends on: {frontmatter.depends_on.join(', ')}
            </span>
          )}
        </div>
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

import React from 'react';

export default function MarkdownRenderer({ html, frontmatter }) {
  if (!html) return null;

  const status = frontmatter?.status;
  const statusStyles = {
    complete: 'bg-green-100 text-green-800 border-green-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div>
      {/* Frontmatter metadata header */}
      {frontmatter && Object.keys(frontmatter).length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          {status && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || statusStyles.pending}`}>
              {status}
            </span>
          )}
          {frontmatter.step !== undefined && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              step {frontmatter.step}
            </span>
          )}
          {frontmatter.tags?.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
              #{tag}
            </span>
          ))}
          {frontmatter.depends_on?.length > 0 && (
            <span className="text-xs text-gray-500">
              depends on: {frontmatter.depends_on.join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Rendered markdown */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

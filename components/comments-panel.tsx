'use client'

import { useState } from 'react'
import { useContentStore } from '@/lib/store'
import { createComment, formatActivityTime } from '@/lib/collaboration-utils'
import { Button } from './ui/button'

interface CommentsPanelProps {
  contentId: string
  isOpen: boolean
  onClose: () => void
}

export function CommentsPanel({ contentId, isOpen, onClose }: CommentsPanelProps) {
  const { comments, team, addComment, deleteComment } = useContentStore()
  const [newComment, setNewComment] = useState('')
  const [selectedMember, setSelectedMember] = useState(team[0]?.name || '')

  const contentComments = comments.filter((c) => c.contentId === contentId)
  const sortedComments = [...contentComments].sort((a, b) => a.createdAt - b.createdAt)

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedMember) return
    const comment = createComment(contentId, selectedMember, newComment)
    addComment(comment)
    setNewComment('')
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-background border-l border-border shadow-lg z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Comments ({contentComments.length})</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {sortedComments.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No comments yet. Start a discussion!
            </div>
          ) : (
            sortedComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-muted/40 rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{comment.authorId}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatActivityTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {comment.text}
                </p>
                <button
                  onClick={() => deleteComment(comment.id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        {team.length > 0 && (
          <div className="border-t border-border bg-background px-6 py-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Posting as
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {team.map((member) => (
                  <option
                    key={member.name}
                    value={member.name}
                  >
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment... (use @name to mention)"
              className="w-full px-3 py-2 bg-muted border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={3}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="flex-1"
                size="sm"
              >
                Comment
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {team.length === 0 && (
          <div className="border-t border-border bg-background px-6 py-4 text-xs text-muted-foreground text-center">
            Add team members to enable comments
          </div>
        )}
      </div>
    </>
  )
}

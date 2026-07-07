'use client'

import { useState } from 'react'
import { useContentStore } from '@/lib/store'
import { createComment, formatActivityTime, REACTION_EMOJIS } from '@/lib/collaboration-utils'
import { createNotification } from '@/lib/notifications-utils'
import { getViewerName } from '@/lib/viewer'
import { Button } from './ui/button'

interface CommentsPanelProps {
  contentId: string
  isOpen: boolean
  onClose: () => void
}

// Render teks komentar, nge-highlight @mention yang namanya cocok sama anggota tim
function renderCommentText(text: string, teamNames: string[]) {
  const parts = text.split(/(@[\w.]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const name = part.slice(1)
      const isKnown = teamNames.some((n) => n.toLowerCase() === name.toLowerCase())
      if (isKnown) {
        return (
          <span key={i} className="text-[#0036ff] font-semibold">
            {part}
          </span>
        )
      }
    }
    return <span key={i}>{part}</span>
  })
}

export function CommentsPanel({ contentId, isOpen, onClose }: CommentsPanelProps) {
  const { comments, team, addComment, deleteComment, toggleCommentReaction, addNotification } = useContentStore()
  const [newComment, setNewComment] = useState('')

  const viewerName = getViewerName()
  const teamNames = team.map((m) => m.name)

  const contentComments = comments.filter((c) => c.contentId === contentId)
  const sortedComments = [...contentComments].sort((a, b) => a.createdAt - b.createdAt)

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comment = createComment(contentId, viewerName, newComment)
    addComment(comment)

    // Notifikasi buat mention yang cocok sama nama tim (cek per-nama, hindari salah tangkap)
    const mentioned = teamNames.filter((name) => {
      const firstWord = name.split(' ')[0]
      const re = new RegExp(`@${firstWord}\\b`, 'i')
      return re.test(newComment)
    })
    mentioned.forEach((name) => {
      addNotification(
        createNotification(
          'team_mention',
          `${viewerName} menyebut @${name}`,
          newComment.length > 80 ? `${newComment.slice(0, 80)}…` : newComment,
          contentId
        )
      )
    })

    setNewComment('')
  }

  const handleReact = (commentId: string, emoji: string) => {
    toggleCommentReaction(commentId, viewerName, emoji)
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
            sortedComments.map((comment) => {
              const reactions = comment.reactions ?? {}
              const reactionCounts: Record<string, number> = {}
              Object.values(reactions).forEach((emoji) => {
                reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1
              })
              const myReaction = reactions[viewerName]

              return (
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
                    {renderCommentText(comment.text, teamNames)}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      {REACTION_EMOJIS.map((emoji) => {
                        const count = reactionCounts[emoji] || 0
                        const active = myReaction === emoji
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReact(comment.id, emoji)}
                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                              active
                                ? 'bg-[#0036ff]/20 border border-[#0036ff]'
                                : 'border border-transparent hover:border-border'
                            }`}
                            title={active ? 'Batal reaksi' : 'Kasih reaksi'}
                          >
                            {emoji}
                            {count > 0 && <span className="ml-1 text-[10px]">{count}</span>}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-border bg-background px-6 py-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Posting sebagai <span className="font-semibold text-foreground">{viewerName}</span>
          </p>

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
      </div>
    </>
  )
}

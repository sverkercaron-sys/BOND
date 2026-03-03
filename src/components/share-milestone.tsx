'use client';

import { useState } from 'react';

export interface Milestone {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

interface ShareMilestoneProps {
  milestone: Milestone;
  onClose: () => void;
}

export function ShareMilestone({ milestone, onClose }: ShareMilestoneProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bond.app';
  const shareText = `Vi har nått ${milestone.label} på BOND! 🔥 ${appUrl}`;
  const shareUrl = `${appUrl}?milestone=${milestone.id}`;

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BOND',
          text: shareText,
          url: shareUrl,
        });
        markMilestoneAsShared();
        setShared(true);
      } catch (error) {
        if (error instanceof Error && error.message !== 'Share cancelled.') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      markMilestoneAsShared();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      markMilestoneAsShared();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const markMilestoneAsShared = async () => {
    try {
      await fetch(`/api/milestones/${milestone.id}/share`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to mark milestone as shared:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="border-b border-bond-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-bond-primary">
              Grattis! 🎉
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition text-xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Milestone Display */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{milestone.emoji}</div>
            <h3 className="text-2xl font-bold text-bond-primary mb-2">
              {milestone.label}
            </h3>
            <p className="text-gray-600">
              {milestone.description}
            </p>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            {/* Web Share API */}
            {navigator.share && (
              <button
                onClick={handleWebShare}
                className="w-full bg-bond-secondary hover:bg-bond-secondary-dark text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <span>📱</span>
                Dela på sociala medier
              </button>
            )}

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full bg-bond-50 hover:bg-bond-100 text-bond-primary font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <span>{copied ? '✓' : '🔗'}</span>
              {copied ? 'Länk kopierad!' : 'Kopiera länk'}
            </button>

            {/* Copy Text (Fallback) */}
            {!navigator.share && (
              <button
                onClick={handleCopyText}
                className="w-full bg-bond-50 hover:bg-bond-100 text-bond-primary font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <span>{copied ? '✓' : '📋'}</span>
                {copied ? 'Text kopierad!' : 'Kopiera text'}
              </button>
            )}

            {/* Text Preview (Fallback) */}
            {!navigator.share && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                  Delningstext:
                </p>
                <p className="text-sm text-gray-700 break-words">
                  {shareText}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-bond-50 p-6">
          <button
            onClick={onClose}
            className="w-full text-gray-600 hover:text-gray-900 font-semibold transition"
          >
            Stäng
          </button>
        </div>

        {shared && (
          <div className="border-t border-bond-50 bg-bond-50 px-6 py-3 text-center text-sm text-bond-primary font-semibold">
            ✨ Milstolpe markerad som delad
          </div>
        )}
      </div>
    </div>
  );
}

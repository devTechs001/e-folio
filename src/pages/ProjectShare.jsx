import React, { useState } from 'react';
import '../styles/ProjectShare.css';

const ProjectShare = ({ project, onShare }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Return null if no project is provided
  if (!project) {
    return null;
  }

  const shareUrl = `${window.location.origin}/projects/${project.id}`;
  const shareTitle = `Check out ${project.title}`;
  const shareText = project.description;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Call the onShare callback if provided
      if (onShare) {
        onShare(project.id, 'clipboard');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async (platform) => {
    try {
      // Call the onShare callback if provided
      if (onShare) {
        await onShare(project.id, platform);
      } else {
        // Fallback to manual sharing
        const urls = {
          twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
          facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`,
          telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
        };

        if (urls[platform]) {
          window.open(urls[platform], '_blank', 'width=600,height=400');
        }
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        
        // Call the onShare callback if provided
        if (onShare) {
          onShare(project.id, 'native');
        }
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <div className="project-share">
      <button
        className="share-trigger-btn"
        onClick={() => setShowShareMenu(!showShareMenu)}
        aria-label="Share project"
      >
        <i className="fa-solid fa-share-nodes"></i>
        <span>Share</span>
      </button>

      {showShareMenu && (
        <>
          <div 
            className="share-backdrop" 
            onClick={() => setShowShareMenu(false)}
          />
          <div className="share-menu">
            <div className="share-menu-header">
              <h4>Share Project</h4>
              <button 
                onClick={() => setShowShareMenu(false)}
                className="share-close-btn"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <div className="share-options">
              {/* Native Share (Mobile) */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="share-option share-native"
                >
                  <i className="fa-solid fa-share"></i>
                  <span>Share</span>
                </button>
              )}

              {/* Social Platforms */}
              <button
                onClick={() => handleShare('twitter')}
                className="share-option share-twitter"
              >
                <i className="fa-brands fa-twitter"></i>
                <span>Twitter</span>
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="share-option share-facebook"
              >
                <i className="fa-brands fa-facebook"></i>
                <span>Facebook</span>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="share-option share-linkedin"
              >
                <i className="fa-brands fa-linkedin"></i>
                <span>LinkedIn</span>
              </button>

              <button
                onClick={() => handleShare('reddit')}
                className="share-option share-reddit"
              >
                <i className="fa-brands fa-reddit"></i>
                <span>Reddit</span>
              </button>

              <button
                onClick={() => handleShare('whatsapp')}
                className="share-option share-whatsapp"
              >
                <i className="fa-brands fa-whatsapp"></i>
                <span>WhatsApp</span>
              </button>

              <button
                onClick={() => handleShare('telegram')}
                className="share-option share-telegram"
              >
                <i className="fa-brands fa-telegram"></i>
                <span>Telegram</span>
              </button>
            </div>

            {/* Copy Link */}
            <div className="share-copy">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="share-url-input"
              />
              <button
                onClick={handleCopyLink}
                className={`share-copy-btn ${copied ? 'copied' : ''}`}
              >
                <i className={`fa-solid fa-${copied ? 'check' : 'copy'}`}></i>
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectShare;
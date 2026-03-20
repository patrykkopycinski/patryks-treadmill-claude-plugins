/*
 * Test file with known XSS vulnerabilities for security-reviewer skill validation
 * DO NOT USE IN PRODUCTION - Contains intentional security flaws
 */

import React, { useState, useEffect } from 'react';
import { EuiPage, EuiPageBody } from '@elastic/eui';

interface Comment {
  id: string;
  author: string;
  body: string;
}

export const VulnerableCommentDisplay: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    // Fetch comments from API
    fetch('/api/comments')
      .then((res) => res.json())
      .then((data) => setComments(data));
  }, []);

  return (
    <EuiPage>
      <EuiPageBody>
        <h1>Comments</h1>
        {comments.map((comment) => (
          <div key={comment.id}>
            <h3>{comment.author}</h3>
            {/* VULNERABILITY: XSS via dangerouslySetInnerHTML */}
            <div dangerouslySetInnerHTML={{ __html: comment.body }} />
          </div>
        ))}
      </EuiPageBody>
    </EuiPage>
  );
};

export const VulnerableUserProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const [bio, setBio] = useState('');

  useEffect(() => {
    fetch(`/api/users/${userId}/bio`)
      .then((res) => res.text())
      .then((data) => setBio(data));
  }, [userId]);

  // VULNERABILITY: Direct innerHTML manipulation
  useEffect(() => {
    const element = document.getElementById('user-bio');
    if (element) {
      element.innerHTML = bio; // DANGER: XSS risk
    }
  }, [bio]);

  return (
    <div>
      <h2>User Bio</h2>
      <div id="user-bio" />
    </div>
  );
};

export const VulnerableNotification: React.FC<{ message: string }> = ({ message }) => {
  // VULNERABILITY: document.write
  useEffect(() => {
    document.write(message); // DANGER: XSS risk
  }, [message]);

  return null;
};

// SAFE EXAMPLE (for comparison)
export const SafeCommentDisplay: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    fetch('/api/comments')
      .then((res) => res.json())
      .then((data) => setComments(data));
  }, []);

  return (
    <EuiPage>
      <EuiPageBody>
        <h1>Comments (Safe)</h1>
        {comments.map((comment) => (
          <div key={comment.id}>
            <h3>{comment.author}</h3>
            {/* SAFE: React automatically escapes text content */}
            <div>{comment.body}</div>
          </div>
        ))}
      </EuiPageBody>
    </EuiPage>
  );
};

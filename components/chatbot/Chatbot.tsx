/**
 * Chatbot Component
 * 
 * Main component that combines the floating button and chat window.
 * This component manages the chat state and can be easily integrated into any page.
 */

'use client';

import { useState } from 'react';
import { FloatingChatButton } from './FloatingChatButton';
import { ChatWindow } from './ChatWindow';

interface ChatbotProps {
  learningContext?: string;
}

export function Chatbot({ learningContext }: ChatbotProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount] = useState(0); // Can be connected to state management later

  const handleToggleChat = () => {
    setIsChatOpen((prev) => !prev);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <FloatingChatButton
        onClick={handleToggleChat}
        isOpen={isChatOpen}
        unreadCount={unreadCount}
      />
      <ChatWindow
        isOpen={isChatOpen}
        onClose={handleCloseChat}
        learningContext={learningContext}
      />
    </>
  );
}
